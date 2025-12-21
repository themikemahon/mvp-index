-- Sample threat data for development and testing
INSERT INTO threat_data (
    title, 
    subhead, 
    description, 
    coordinates, 
    threat_type, 
    severity, 
    region, 
    brands, 
    topics, 
    is_quantitative, 
    statistical_data, 
    sources
) VALUES 
-- Vulnerability data points
(
    'Critical Infrastructure Vulnerability',
    'Power grid systems exposed to cyber attacks',
    'Multiple power grid control systems in the northeastern United States have been identified with critical vulnerabilities that could allow remote attackers to disrupt electrical distribution.',
    POINT(-74.0060, 40.7128), -- New York City
    'vulnerability',
    9,
    'North America',
    ARRAY['ConEd', 'National Grid'],
    ARRAY['infrastructure', 'power grid', 'critical systems'],
    true,
    '{"affected_systems": 47, "potential_impact": "2.3 million customers", "cvss_score": 9.1}',
    ARRAY['DHS-CISA', 'Internal Research']
),
(
    'Banking Malware Campaign',
    'Sophisticated trojan targeting financial institutions',
    'A new strain of banking malware has been detected targeting major financial institutions across Europe, with capabilities to bypass two-factor authentication systems.',
    POINT(2.3522, 48.8566), -- Paris
    'vulnerability',
    8,
    'Europe',
    ARRAY['BNP Paribas', 'Deutsche Bank', 'ING'],
    ARRAY['banking', 'malware', 'financial fraud'],
    true,
    '{"institutions_affected": 12, "estimated_losses": "$4.2M", "detection_rate": "23%"}',
    ARRAY['Europol', 'Financial Intelligence Unit']
),
-- Scam data points
(
    'Cryptocurrency Investment Scam',
    'Fake trading platform defrauds investors',
    'A sophisticated cryptocurrency investment scam operating from Southeast Asia has defrauded over 10,000 investors worldwide through a fake trading platform promising guaranteed returns.',
    POINT(103.8198, 1.3521), -- Singapore
    'scam',
    7,
    'Southeast Asia',
    ARRAY['Bitcoin', 'Ethereum'],
    ARRAY['cryptocurrency', 'investment fraud', 'ponzi scheme'],
    true,
    '{"victims": 10247, "total_losses": "$89.3M", "average_loss": "$8,720"}',
    ARRAY['Singapore Police', 'Interpol']
),
-- Protection data points
(
    'Advanced Threat Detection System',
    'AI-powered cybersecurity deployment',
    'A state-of-the-art AI-powered threat detection system has been successfully deployed across major financial institutions in Tokyo, providing real-time protection against advanced persistent threats.',
    POINT(139.6917, 35.6895), -- Tokyo
    'protection',
    8,
    'Asia Pacific',
    ARRAY['Mitsubishi UFJ', 'Sumitomo Mitsui', 'Mizuho'],
    ARRAY['AI security', 'threat detection', 'financial protection'],
    true,
    '{"institutions_protected": 8, "threats_blocked": 15420, "false_positive_rate": "0.3%"}',
    ARRAY['Japan Financial Services Agency', 'Gen Digital Research']
),
(
    'Secure Communication Network',
    'End-to-end encrypted messaging for government',
    'A new secure communication network has been established for government agencies in Northern Europe, providing quantum-resistant encryption for sensitive communications.',
    POINT(10.7522, 59.9139), -- Oslo
    'protection',
    9,
    'Northern Europe',
    ARRAY['Norwegian Government', 'NATO'],
    ARRAY['encryption', 'government security', 'quantum resistance'],
    false,
    null,
    ARRAY['Norwegian Defence Research Establishment']
),
-- Financial risk data points
(
    'Market Manipulation Scheme',
    'Coordinated pump-and-dump operation detected',
    'A large-scale market manipulation scheme involving coordinated social media campaigns and algorithmic trading has been detected affecting multiple cryptocurrency exchanges.',
    POINT(-0.1276, 51.5074), -- London
    'financial_risk',
    6,
    'Europe',
    ARRAY['Binance', 'Coinbase', 'Kraken'],
    ARRAY['market manipulation', 'social media', 'algorithmic trading'],
    true,
    '{"affected_tokens": 23, "artificial_volume": "$127M", "price_inflation": "340%"}',
    ARRAY['Financial Conduct Authority', 'Market Analysis Team']
),
-- Additional global data points for visualization
(
    'Supply Chain Attack',
    'Software supply chain compromise',
    'A sophisticated supply chain attack has been discovered affecting software development tools used by major technology companies worldwide.',
    POINT(-122.4194, 37.7749), -- San Francisco
    'vulnerability',
    9,
    'North America',
    ARRAY['Microsoft', 'Google', 'Apple'],
    ARRAY['supply chain', 'software security', 'development tools'],
    true,
    '{"affected_companies": 156, "compromised_packages": 47, "potential_reach": "50M+ users"}',
    ARRAY['CISA', 'Private Security Research']
),
(
    'Ransomware Protection Initiative',
    'Multi-layered defense system deployment',
    'A comprehensive ransomware protection initiative has been successfully implemented across healthcare systems in Australia, significantly reducing attack success rates.',
    POINT(151.2093, -33.8688), -- Sydney
    'protection',
    8,
    'Australia',
    ARRAY['NSW Health', 'Queensland Health'],
    ARRAY['ransomware protection', 'healthcare security', 'backup systems'],
    true,
    '{"hospitals_protected": 89, "attacks_prevented": 234, "recovery_time_improvement": "85%"}',
    ARRAY['Australian Cyber Security Centre']
),

-- AFRICA - Adding diverse threat data across the continent
(
    'Mobile Banking Fraud Ring',
    'SMS-based financial fraud targeting mobile payments',
    'A sophisticated fraud ring has been dismantled in Lagos, targeting mobile banking users through SMS phishing and SIM swapping attacks.',
    POINT(3.3792, 6.5244), -- Lagos, Nigeria
    'scam',
    7,
    'West Africa',
    ARRAY['MTN', 'Airtel', 'Glo'],
    ARRAY['mobile banking', 'SMS fraud', 'SIM swapping'],
    true,
    '{"victims": 8500, "total_losses": "$12.4M", "recovery_rate": "31%"}',
    ARRAY['Nigerian Communications Commission', 'EFCC']
),
(
    'Cybersecurity Training Center',
    'Regional cybersecurity capacity building',
    'A new cybersecurity training center has been established in Nairobi to build regional capacity for threat detection and incident response across East Africa.',
    POINT(36.8219, -1.2921), -- Nairobi, Kenya
    'protection',
    6,
    'East Africa',
    ARRAY['Safaricom', 'Kenya Commercial Bank'],
    ARRAY['cybersecurity training', 'capacity building', 'incident response'],
    true,
    '{"trainees": 450, "institutions_served": 23, "response_time_improvement": "60%"}',
    ARRAY['Kenya Cyber Security Agency']
),
(
    'Mining Infrastructure Attack',
    'Industrial control systems compromised',
    'Critical mining infrastructure in South Africa has been targeted by sophisticated attackers, compromising industrial control systems and causing production delays.',
    POINT(28.0473, -26.2041), -- Johannesburg, South Africa
    'vulnerability',
    8,
    'Southern Africa',
    ARRAY['Anglo American', 'Gold Fields', 'Sibanye-Stillwater'],
    ARRAY['industrial control', 'mining security', 'critical infrastructure'],
    true,
    '{"facilities_affected": 7, "production_loss": "$23M", "downtime_hours": 156}',
    ARRAY['South African Cyber Security Hub']
),
(
    'Digital Identity Protection',
    'Biometric security system deployment',
    'Morocco has successfully deployed a national digital identity protection system using advanced biometric security to prevent identity theft and fraud.',
    POINT(-6.8498, 34.0209), -- Rabat, Morocco
    'protection',
    7,
    'North Africa',
    ARRAY['Moroccan Government', 'OCP Group'],
    ARRAY['digital identity', 'biometric security', 'fraud prevention'],
    true,
    '{"citizens_protected": 2.1e6, "fraud_reduction": "78%", "system_uptime": "99.7%"}',
    ARRAY['Moroccan Digital Development Agency']
),

-- SOUTH AMERICA - Expanding coverage across the continent
(
    'E-commerce Fraud Network',
    'Cross-border online shopping scams',
    'A major e-commerce fraud network operating across South America has been disrupted, affecting online marketplaces and payment processors.',
    POINT(-46.6333, -23.5505), -- São Paulo, Brazil
    'scam',
    6,
    'South America',
    ARRAY['MercadoLibre', 'PagSeguro', 'Stone'],
    ARRAY['e-commerce fraud', 'payment fraud', 'online marketplace'],
    true,
    '{"fraudulent_transactions": 45000, "merchant_losses": "$18.7M", "affected_countries": 8}',
    ARRAY['Brazilian Federal Police', 'Interpol']
),
(
    'Financial Sector Resilience',
    'Banking sector cybersecurity enhancement',
    'Chile has implemented comprehensive cybersecurity measures across its banking sector, establishing new standards for financial institution security.',
    POINT(-70.6693, -33.4489), -- Santiago, Chile
    'protection',
    8,
    'South America',
    ARRAY['Banco de Chile', 'BancoEstado', 'Santander Chile'],
    ARRAY['banking security', 'financial resilience', 'regulatory compliance'],
    true,
    '{"banks_compliant": 24, "security_incidents_reduced": "67%", "customer_confidence": "94%"}',
    ARRAY['Chilean Financial Market Commission']
),
(
    'Cryptocurrency Mining Malware',
    'Illegal mining operations detected',
    'Large-scale cryptocurrency mining malware has been detected across corporate networks in Argentina, consuming significant computational resources.',
    POINT(-58.3816, -34.6037), -- Buenos Aires, Argentina
    'vulnerability',
    5,
    'South America',
    ARRAY['YPF', 'Telecom Argentina', 'Grupo Clarín'],
    ARRAY['cryptojacking', 'malware', 'resource theft'],
    true,
    '{"infected_systems": 2340, "energy_cost": "$890K", "performance_impact": "35%"}',
    ARRAY['Argentine Cyber Security Agency']
),
(
    'Government Data Breach',
    'Sensitive citizen data exposed',
    'A significant data breach at government agencies in Colombia has exposed personal information of millions of citizens, prompting emergency response measures.',
    POINT(-74.0721, 4.7110), -- Bogotá, Colombia
    'vulnerability',
    9,
    'South America',
    ARRAY['Colombian Government', 'DANE', 'Registraduría'],
    ARRAY['data breach', 'government security', 'personal data'],
    true,
    '{"records_exposed": 4.2e6, "data_types": 12, "notification_time": "72 hours"}',
    ARRAY['Colombian Cyber Defense Command']
),

-- CENTRAL ASIA & MIDDLE EAST - Adding regional diversity
(
    'Oil Infrastructure Cyber Attack',
    'Critical energy systems targeted',
    'Sophisticated cyber attacks have targeted oil and gas infrastructure across the Middle East, with potential for significant economic disruption.',
    POINT(51.4231, 35.6961), -- Tehran, Iran
    'vulnerability',
    9,
    'Middle East',
    ARRAY['NIOC', 'Petronas', 'ADNOC'],
    ARRAY['energy security', 'critical infrastructure', 'nation-state'],
    true,
    '{"facilities_targeted": 15, "potential_impact": "$2.1B", "attribution_confidence": "high"}',
    ARRAY['Regional Cyber Security Alliance']
),
(
    'Digital Banking Innovation',
    'Secure fintech ecosystem development',
    'The UAE has launched a comprehensive digital banking security framework, establishing Dubai as a leading fintech hub with advanced security measures.',
    POINT(55.2708, 25.2048), -- Dubai, UAE
    'protection',
    8,
    'Middle East',
    ARRAY['Emirates NBD', 'ADCB', 'Mashreq Bank'],
    ARRAY['fintech security', 'digital banking', 'innovation hub'],
    true,
    '{"fintech_companies": 127, "security_certifications": 89, "investment_attracted": "$1.8B"}',
    ARRAY['UAE Central Bank', 'Dubai Financial Services Authority']
),
(
    'Telecommunications Vulnerability',
    'Mobile network infrastructure exposed',
    'Critical vulnerabilities have been discovered in mobile telecommunications infrastructure across Central Asia, affecting millions of subscribers.',
    POINT(71.4704, 51.1801), -- Nur-Sultan, Kazakhstan
    'vulnerability',
    7,
    'Central Asia',
    ARRAY['Kazakhtelecom', 'Beeline', 'Tele2'],
    ARRAY['telecommunications', 'mobile security', 'infrastructure'],
    true,
    '{"subscribers_affected": 8.9e6, "network_coverage": "78%", "patch_timeline": "90 days"}',
    ARRAY['Kazakhstan Cyber Security Committee']
),

-- NORTHERN REGIONS - Arctic and Northern territories
(
    'Arctic Research Network Security',
    'Climate research data protection',
    'A secure network has been established to protect critical climate research data across Arctic research stations, ensuring data integrity and availability.',
    POINT(-21.8174, 64.1466), -- Reykjavik, Iceland
    'protection',
    7,
    'Arctic',
    ARRAY['University of Iceland', 'Arctic Council'],
    ARRAY['climate research', 'data protection', 'scientific collaboration'],
    true,
    '{"research_stations": 34, "data_protected": "12TB", "uptime_guarantee": "99.9%"}',
    ARRAY['Arctic Research Consortium']
),

-- ISLAND NATIONS - Pacific and Caribbean
(
    'Tourism Sector Cyber Threats',
    'Hospitality industry targeted by ransomware',
    'The tourism sector in the Caribbean has faced increased ransomware attacks, targeting hotel booking systems and customer databases.',
    POINT(-61.2225, 13.1939), -- Barbados
    'vulnerability',
    6,
    'Caribbean',
    ARRAY['Sandals Resorts', 'Marriott Caribbean', 'Hilton Caribbean'],
    ARRAY['hospitality security', 'ransomware', 'tourism'],
    true,
    '{"hotels_affected": 23, "bookings_disrupted": 15000, "recovery_cost": "$4.3M"}',
    ARRAY['Caribbean Cyber Security Centre']
),
(
    'Maritime Security Initiative',
    'Port cybersecurity enhancement',
    'New Zealand has implemented advanced cybersecurity measures across its major ports, protecting critical maritime infrastructure from cyber threats.',
    POINT(174.7633, -36.8485), -- Auckland, New Zealand
    'protection',
    8,
    'Oceania',
    ARRAY['Ports of Auckland', 'Port of Tauranga'],
    ARRAY['maritime security', 'port infrastructure', 'supply chain'],
    true,
    '{"ports_secured": 12, "cargo_volume_protected": "45M tonnes", "incident_reduction": "82%"}',
    ARRAY['New Zealand Maritime Security']
),

-- REMOTE REGIONS - Adding points in less populated but strategic areas
(
    'Satellite Communication Breach',
    'Remote communication systems compromised',
    'Critical satellite communication systems serving remote regions of Russia have been compromised, affecting emergency services and military communications.',
    POINT(104.2964, 52.2978), -- Irkutsk, Russia
    'vulnerability',
    8,
    'Northern Asia',
    ARRAY['Roscosmos', 'Russian Satellite Communications'],
    ARRAY['satellite security', 'remote communications', 'emergency services'],
    true,
    '{"satellites_affected": 7, "coverage_area": "2.1M km²", "service_disruption": "48 hours"}',
    ARRAY['Russian Cyber Security Agency']
),
(
    'Mining Data Protection',
    'Secure data systems for resource extraction',
    'Advanced data protection systems have been deployed across mining operations in Western Australia, securing geological and operational data.',
    POINT(115.8605, -31.9505), -- Perth, Australia
    'protection',
    7,
    'Australia',
    ARRAY['BHP', 'Rio Tinto', 'Fortescue Metals'],
    ARRAY['mining security', 'geological data', 'operational security'],
    true,
    '{"mining_sites": 67, "data_encrypted": "890TB", "security_compliance": "100%"}',
    ARRAY['Australian Mining Security Council']
),

-- ADDITIONAL STRATEGIC LOCATIONS
(
    'Cross-Border Payment Fraud',
    'International money transfer scams',
    'A sophisticated cross-border payment fraud scheme has been uncovered, targeting migrant workers and international money transfer services.',
    POINT(77.2090, 28.6139), -- New Delhi, India
    'scam',
    7,
    'South Asia',
    ARRAY['Western Union', 'MoneyGram', 'Remitly'],
    ARRAY['payment fraud', 'money transfer', 'migrant workers'],
    true,
    '{"victims": 12500, "fraudulent_transfers": "$34.6M", "countries_affected": 15}',
    ARRAY['Reserve Bank of India', 'Financial Intelligence Unit']
),
(
    'Smart City Security Framework',
    'Urban infrastructure protection system',
    'South Korea has deployed a comprehensive smart city security framework, protecting IoT infrastructure and citizen data across major urban centers.',
    POINT(126.9780, 37.5665), -- Seoul, South Korea
    'protection',
    9,
    'East Asia',
    ARRAY['Samsung', 'LG', 'SK Telecom'],
    ARRAY['smart city', 'IoT security', 'urban infrastructure'],
    true,
    '{"IoT_devices_secured": 2.3e6, "data_breaches_prevented": 156, "citizen_satisfaction": "91%"}',
    ARRAY['Korea Internet & Security Agency']
),
(
    'Agricultural Cyber Threats',
    'Precision farming systems targeted',
    'Cyber attacks targeting precision agriculture systems have been detected across farming operations in Ukraine, potentially affecting food security.',
    POINT(30.5234, 50.4501), -- Kyiv, Ukraine
    'vulnerability',
    6,
    'Eastern Europe',
    ARRAY['John Deere', 'Case IH', 'Ukrainian Agribusiness'],
    ARRAY['precision agriculture', 'food security', 'farming technology'],
    true,
    '{"farms_affected": 340, "crop_area": "125,000 hectares", "yield_impact": "12%"}',
    ARRAY['Ukrainian Cyber Police']
);

-- Update statistics for the database
ANALYZE threat_data;