/**
 * Mapping of medical specialties to standardized codes and related terms
 * This helps normalize AI-generated specialty recommendations with real medical taxonomy
 */

const specialtyMapping = {
    // Primary Care
    'family medicine': '207Q00000X',
    'internal medicine': '207R00000X',
    'general practice': '208D00000X',
    'pediatrics': '208000000X',
    'geriatrics': '207QG0300X',
    
    // Cardiology
    'cardiology': '207RC0000X',
    'cardiac surgery': '208G00000X',
    'cardiovascular surgery': '208G00000X',
    'interventional cardiology': '207RI0200X',
    'vascular surgery': '208G00000X',
    
    // Neurology & Mental Health
    'neurology': '207RN0300X',
    'neurosurgery': '207T00000X',
    'psychiatry': '207R00000X',
    'psychology': '103T00000X',
    'neuropsychology': '103GC0700X',
    
    // Orthopedics & Sports Medicine
    'orthopedic surgery': '207X00000X',
    'orthopedics': '207X00000X',
    'sports medicine': '207XX0004X',
    'physical therapy': '225100000X',
    'occupational therapy': '225X00000X',
    
    // Dermatology & Plastic Surgery
    'dermatology': '207N00000X',
    'plastic surgery': '208200000X',
    'cosmetic surgery': '208200000X',
    'dermatopathology': '207ND0101X',
    
    // Emergency & Urgent Care
    'emergency medicine': '207P00000X',
    'urgent care': '207Q00000X',
    'critical care': '207RC0001X',
    'trauma surgery': '208600000X',
    
    // Gastroenterology
    'gastroenterology': '207RG0100X',
    'hepatology': '207RG0100X',
    'colorectal surgery': '208C00000X',
    
    // Pulmonology
    'pulmonology': '207RP1001X',
    'respiratory medicine': '207RP1001X',
    'sleep medicine': '207RS0010X',
    
    // Endocrinology
    'endocrinology': '207RE0101X',
    'diabetes': '207RE0101X',
    'metabolism': '207RE0101X',
}