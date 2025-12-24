/**
 * Voice control utilities for accessibility
 * Provides voice commands for navigation and interaction
 */

export interface VoiceCommand {
  phrases: string[];
  action: () => void;
  description: string;
  category: 'navigation' | 'search' | 'interaction' | 'globe';
}

export interface VoiceControlOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Voice control manager for accessibility
 */
export class VoiceControlManager {
  private recognition: SpeechRecognition | null = null;
  private commands: VoiceCommand[] = [];
  private isListening = false;
  private options: VoiceControlOptions;

  constructor(options: VoiceControlOptions = {}) {
    this.options = {
      language: 'en-US',
      continuous: true,
      interimResults: false,
      ...options,
    };
    
    this.initializeSpeechRecognition();
  }

  /**
   * Check if voice control is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    if (!VoiceControlManager.isSupported()) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = this.options.continuous || false;
    this.recognition.interimResults = this.options.interimResults || false;
    this.recognition.lang = this.options.language || 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd?.();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;

      this.options.onResult?.(transcript, confidence);
      this.processCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      const errorMessage = this.getErrorMessage(event.error);
      this.options.onError?.(errorMessage);
      console.error('Speech recognition error:', errorMessage);
    };
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not available. Please check your microphone settings.';
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access to use voice commands.';
      case 'network':
        return 'Network error. Please check your internet connection.';
      case 'service-not-allowed':
        return 'Voice recognition service not available.';
      default:
        return `Voice recognition error: ${error}`;
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.options.onError?.('Failed to start voice recognition');
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) return;
    
    this.recognition.stop();
  }

  /**
   * Toggle listening state
   */
  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  /**
   * Register a voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  /**
   * Register multiple voice commands
   */
  registerCommands(commands: VoiceCommand[]): void {
    this.commands.push(...commands);
  }

  /**
   * Remove a voice command
   */
  removeCommand(phrases: string[]): void {
    this.commands = this.commands.filter(
      command => !phrases.some(phrase => command.phrases.includes(phrase))
    );
  }

  /**
   * Clear all voice commands
   */
  clearCommands(): void {
    this.commands = [];
  }

  /**
   * Process voice command
   */
  private processCommand(transcript: string): void {
    const matchedCommand = this.findMatchingCommand(transcript);
    
    if (matchedCommand) {
      try {
        matchedCommand.action();
      } catch (error) {
        console.error('Error executing voice command:', error);
        this.options.onError?.('Failed to execute voice command');
      }
    }
  }

  /**
   * Find matching command for transcript
   */
  private findMatchingCommand(transcript: string): VoiceCommand | null {
    for (const command of this.commands) {
      for (const phrase of command.phrases) {
        if (this.matchesPhrase(transcript, phrase)) {
          return command;
        }
      }
    }
    return null;
  }

  /**
   * Check if transcript matches a command phrase
   */
  private matchesPhrase(transcript: string, phrase: string): boolean {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    // Exact match
    if (normalizedTranscript === normalizedPhrase) {
      return true;
    }
    
    // Contains match (for more flexible recognition)
    if (normalizedTranscript.includes(normalizedPhrase)) {
      return true;
    }
    
    // Word-based fuzzy matching
    const transcriptWords = normalizedTranscript.split(/\s+/);
    const phraseWords = normalizedPhrase.split(/\s+/);
    
    // Check if all phrase words are present in transcript
    return phraseWords.every(word => 
      transcriptWords.some(transcriptWord => 
        transcriptWord.includes(word) || word.includes(transcriptWord)
      )
    );
  }

  /**
   * Get all registered commands
   */
  getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
    return this.commands.filter(command => command.category === category);
  }

  /**
   * Get listening state
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Destroy voice control manager
   */
  destroy(): void {
    this.stopListening();
    this.clearCommands();
    this.recognition = null;
  }
}

/**
 * Default voice commands for the cyber threat globe app
 */
export const createDefaultVoiceCommands = (callbacks: {
  onSearch?: (query: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onOpenFilters?: () => void;
  onCloseModal?: () => void;
  onShowHelp?: () => void;
  onToggleFullscreen?: () => void;
}): VoiceCommand[] => [
  // Navigation commands
  {
    phrases: ['zoom in', 'zoom closer', 'get closer'],
    action: () => callbacks.onZoomIn?.(),
    description: 'Zoom in on the globe',
    category: 'globe',
  },
  {
    phrases: ['zoom out', 'zoom back', 'zoom away'],
    action: () => callbacks.onZoomOut?.(),
    description: 'Zoom out from the globe',
    category: 'globe',
  },
  {
    phrases: ['reset view', 'go home', 'reset globe', 'center globe'],
    action: () => callbacks.onResetView?.(),
    description: 'Reset globe to default view',
    category: 'globe',
  },
  
  // Search commands
  {
    phrases: ['search for', 'find', 'look for', 'show me'],
    action: () => callbacks.onSearch?.(''),
    description: 'Start a search',
    category: 'search',
  },
  {
    phrases: ['search threats', 'find threats', 'show threats'],
    action: () => callbacks.onSearch?.('threats'),
    description: 'Search for threats',
    category: 'search',
  },
  {
    phrases: ['search vulnerabilities', 'find vulnerabilities', 'show vulnerabilities'],
    action: () => callbacks.onSearch?.('vulnerabilities'),
    description: 'Search for vulnerabilities',
    category: 'search',
  },
  
  // Interface commands
  {
    phrases: ['open filters', 'show filters', 'filter options'],
    action: () => callbacks.onOpenFilters?.(),
    description: 'Open filter panel',
    category: 'navigation',
  },
  {
    phrases: ['close', 'close modal', 'close dialog', 'go back'],
    action: () => callbacks.onCloseModal?.(),
    description: 'Close current modal or dialog',
    category: 'navigation',
  },
  {
    phrases: ['help', 'show help', 'what can I say'],
    action: () => callbacks.onShowHelp?.(),
    description: 'Show help and available commands',
    category: 'navigation',
  },
  {
    phrases: ['fullscreen', 'full screen', 'toggle fullscreen'],
    action: () => callbacks.onToggleFullscreen?.(),
    description: 'Toggle fullscreen mode',
    category: 'navigation',
  },
  
  // Interaction commands
  {
    phrases: ['select', 'choose', 'pick this'],
    action: () => {
      // Trigger click on currently focused element
      const focused = document.activeElement as HTMLElement;
      if (focused && typeof focused.click === 'function') {
        focused.click();
      }
    },
    description: 'Select the currently focused item',
    category: 'interaction',
  },
];

/**
 * Voice search utility for search bar integration
 */
export class VoiceSearchManager {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResult: (transcript: string) => void;
  private onError: (error: string) => void;
  private onStart: () => void;
  private onEnd: () => void;

  constructor(callbacks: {
    onResult: (transcript: string) => void;
    onError: (error: string) => void;
    onStart: () => void;
    onEnd: () => void;
  }) {
    this.onResult = callbacks.onResult;
    this.onError = callbacks.onError;
    this.onStart = callbacks.onStart;
    this.onEnd = callbacks.onEnd;
    
    this.initializeSpeechRecognition();
  }

  static isSupported(): boolean {
    return VoiceControlManager.isSupported();
  }

  private initializeSpeechRecognition(): void {
    if (!VoiceSearchManager.isSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      this.onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      const errorMessage = this.getErrorMessage(event.error);
      this.onError(errorMessage);
    };
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not available.';
      case 'not-allowed':
        return 'Microphone access denied.';
      default:
        return 'Voice recognition error.';
    }
  }

  startListening(): void {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (error) {
      this.onError('Failed to start voice recognition');
    }
  }

  stopListening(): void {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stopListening();
    this.recognition = null;
  }
}

// Global type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};