export interface IndianCity {
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  type?: 'home' | 'work' | 'beach' | 'farm' | 'destination' | 'custom';
}

// Curated catalog covering all 28 States & 8 Union Territories with major cities and district hubs
export const INDIAN_CITIES_CATALOG: IndianCity[] = [
  // --- National Capital Territory of Delhi ---
  { name: 'New Delhi (Safdarjung)', district: 'New Delhi', state: 'Delhi', lat: 28.5847, lng: 77.2066, type: 'home' },
  { name: 'Central Delhi (Connaught Place)', district: 'Central Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167, type: 'work' },
  { name: 'South Delhi (Saket)', district: 'South Delhi', state: 'Delhi', lat: 28.5245, lng: 77.2066, type: 'home' },
  { name: 'North Delhi (Civil Lines)', district: 'North Delhi', state: 'Delhi', lat: 28.6833, lng: 77.2167, type: 'destination' },
  { name: 'Dwarka (South West Delhi)', district: 'South West Delhi', state: 'Delhi', lat: 28.5921, lng: 77.0460, type: 'home' },
  { name: 'Rohini (North West Delhi)', district: 'North West Delhi', state: 'Delhi', lat: 28.7495, lng: 77.0565, type: 'home' },
  { name: 'East Delhi (Mayur Vihar)', district: 'East Delhi', state: 'Delhi', lat: 28.6083, lng: 77.2975, type: 'home' },
  { name: 'Noida (NCR)', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, type: 'work' },
  { name: 'Greater Noida (NCR)', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040, type: 'work' },
  { name: 'Gurugram (NCR Cyber City)', district: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266, type: 'work' },
  { name: 'Faridabad (NCR)', district: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178, type: 'work' },
  { name: 'Ghaziabad (NCR)', district: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, type: 'home' },

  // --- Maharashtra ---
  { name: 'Mumbai (Colaba Coastal)', district: 'Mumbai City', state: 'Maharashtra', lat: 18.9067, lng: 72.8147, type: 'beach' },
  { name: 'Mumbai (Bandra Suburban)', district: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.0596, lng: 72.8295, type: 'home' },
  { name: 'Pune (Shivajinagar)', district: 'Pune', state: 'Maharashtra', lat: 18.5308, lng: 73.8475, type: 'work' },
  { name: 'Nagpur (Zero Mile)', district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, type: 'farm' },
  { name: 'Thane', district: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, type: 'home' },
  { name: 'Nashik (Godavari)', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, type: 'destination' },
  { name: 'Aurangabad (Chhatrapati Sambhajinagar)', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8762, lng: 75.3433, type: 'destination' },
  { name: 'Navi Mumbai', district: 'Thane', state: 'Maharashtra', lat: 19.0330, lng: 73.0297, type: 'work' },
  { name: 'Solapur', district: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064, type: 'custom' },
  { name: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433, type: 'destination' },
  { name: 'Amravati', district: 'Amravati', state: 'Maharashtra', lat: 20.9320, lng: 77.7523, type: 'custom' },
  { name: 'Nanded', district: 'Nanded', state: 'Maharashtra', lat: 19.1383, lng: 77.3210, type: 'custom' },
  { name: 'Sangli', district: 'Sangli', state: 'Maharashtra', lat: 16.8524, lng: 74.5815, type: 'farm' },
  { name: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lng: 75.5626, type: 'farm' },
  { name: 'Akola', district: 'Akola', state: 'Maharashtra', lat: 20.7002, lng: 77.0082, type: 'custom' },
  { name: 'Latur', district: 'Latur', state: 'Maharashtra', lat: 18.4088, lng: 76.5604, type: 'custom' },
  { name: 'Dhule', district: 'Dhule', state: 'Maharashtra', lat: 20.9042, lng: 74.7749, type: 'custom' },
  { name: 'Ahmednagar', district: 'Ahmednagar', state: 'Maharashtra', lat: 19.0948, lng: 74.7480, type: 'custom' },
  { name: 'Chandrapur', district: 'Chandrapur', state: 'Maharashtra', lat: 19.9615, lng: 79.2961, type: 'custom' },

  // --- Karnataka ---
  { name: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'work' },
  { name: 'Bangalore', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'work' },
  { name: 'Bengaluru (IMD Bengaluru)', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'work' },
  { name: 'Mysuru (Palace City)', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, type: 'destination' },
  { name: 'Hubballi-Dharwad', district: 'Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.1240, type: 'work' },
  { name: 'Mangaluru (Port Coastal)', district: 'Dakshina Kannada', state: 'Karnataka', lat: 12.9141, lng: 74.8560, type: 'beach' },
  { name: 'Belagavi', district: 'Belagavi', state: 'Karnataka', lat: 15.8497, lng: 74.4977, type: 'custom' },
  { name: 'Kalaburagi (Gulbarga)', district: 'Kalaburagi', state: 'Karnataka', lat: 17.3297, lng: 76.8343, type: 'custom' },
  { name: 'Davanagere', district: 'Davanagere', state: 'Karnataka', lat: 14.4644, lng: 75.9218, type: 'farm' },
  { name: 'Ballari (Bellary)', district: 'Ballari', state: 'Karnataka', lat: 15.1394, lng: 76.9214, type: 'custom' },
  { name: 'Vijayapura (Bijapur)', district: 'Vijayapura', state: 'Karnataka', lat: 16.8302, lng: 75.7100, type: 'destination' },
  { name: 'Shivamogga (Shimoga)', district: 'Shivamogga', state: 'Karnataka', lat: 13.9299, lng: 75.5681, type: 'destination' },
  { name: 'Tumakuru (Tumkur)', district: 'Tumakuru', state: 'Karnataka', lat: 13.3409, lng: 77.1010, type: 'custom' },
  { name: 'Udupi (Coastal)', district: 'Udupi', state: 'Karnataka', lat: 13.3409, lng: 74.7421, type: 'beach' },
  { name: 'Hassan', district: 'Hassan', state: 'Karnataka', lat: 13.0033, lng: 76.1004, type: 'destination' },

  // --- Tamil Nadu ---
  { name: 'Chennai (Meenambakkam)', district: 'Chennai', state: 'Tamil Nadu', lat: 12.9941, lng: 80.1808, type: 'destination' },
  { name: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, type: 'work' },
  { name: 'Madurai (Temple City)', district: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, type: 'destination' },
  { name: 'Tiruchirappalli (Trichy)', district: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047, type: 'custom' },
  { name: 'Salem', district: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, type: 'work' },
  { name: 'Tiruppur (Textile Hub)', district: 'Tiruppur', state: 'Tamil Nadu', lat: 11.1085, lng: 77.3411, type: 'work' },
  { name: 'Erode', district: 'Erode', state: 'Tamil Nadu', lat: 11.3410, lng: 77.7172, type: 'farm' },
  { name: 'Tirunelveli', district: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7139, lng: 77.7567, type: 'custom' },
  { name: 'Vellore', district: 'Vellore', state: 'Tamil Nadu', lat: 12.9165, lng: 79.1325, type: 'custom' },
  { name: 'Thoothukudi (Tuticorin)', district: 'Thoothukudi', state: 'Tamil Nadu', lat: 8.7642, lng: 78.1348, type: 'beach' },
  { name: 'Ooty (Udhagamandalam)', district: 'Nilgiris', state: 'Tamil Nadu', lat: 11.4102, lng: 76.6950, type: 'destination' },
  { name: 'Kanyakumari (Cape Comorin)', district: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.0883, lng: 77.5385, type: 'beach' },
  { name: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu', lat: 10.7870, lng: 79.1378, type: 'destination' },

  // --- West Bengal ---
  { name: 'Kolkata (Alipore)', district: 'Kolkata', state: 'West Bengal', lat: 22.5333, lng: 88.3333, type: 'destination' },
  { name: 'Howrah', district: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636, type: 'work' },
  { name: 'Siliguri (North Bengal)', district: 'Darjeeling', state: 'West Bengal', lat: 26.7271, lng: 88.3953, type: 'destination' },
  { name: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', lat: 23.6739, lng: 86.9524, type: 'work' },
  { name: 'Durgapur', district: 'Paschim Bardhaman', state: 'West Bengal', lat: 23.5204, lng: 87.3119, type: 'work' },
  { name: 'Bardhaman', district: 'Purba Bardhaman', state: 'West Bengal', lat: 23.2324, lng: 87.8615, type: 'farm' },
  { name: 'Darjeeling (Himalayan)', district: 'Darjeeling', state: 'West Bengal', lat: 27.0410, lng: 88.2663, type: 'destination' },
  { name: 'Kharagpur', district: 'Paschim Medinipur', state: 'West Bengal', lat: 22.3460, lng: 87.2320, type: 'work' },
  { name: 'Haldia (Port)', district: 'Purba Medinipur', state: 'West Bengal', lat: 22.0667, lng: 88.0698, type: 'beach' },
  { name: 'Malda', district: 'Malda', state: 'West Bengal', lat: 25.0084, lng: 88.1408, type: 'farm' },

  // --- Telangana ---
  { name: 'Hyderabad (Begumpet)', district: 'Hyderabad', state: 'Telangana', lat: 17.4531, lng: 78.4677, type: 'work' },
  { name: 'Warangal', district: 'Hanamkonda', state: 'Telangana', lat: 17.9689, lng: 79.5941, type: 'destination' },
  { name: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941, type: 'custom' },
  { name: 'Karimnagar', district: 'Karimnagar', state: 'Telangana', lat: 18.4386, lng: 79.1288, type: 'farm' },
  { name: 'Khammam', district: 'Khammam', state: 'Telangana', lat: 17.2473, lng: 80.1514, type: 'custom' },
  { name: 'Ramagundam', district: 'Peddapalli', state: 'Telangana', lat: 18.7551, lng: 79.4738, type: 'work' },

  // --- Gujarat ---
  { name: 'Ahmedabad (Sabarmati)', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, type: 'work' },
  { name: 'Surat (Diamond City)', district: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, type: 'work' },
  { name: 'Vadodara (Baroda)', district: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812, type: 'destination' },
  { name: 'Rajkot (Saurashtra)', district: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022, type: 'work' },
  { name: 'Bhavnagar (Gulf of Khambhat)', district: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519, type: 'beach' },
  { name: 'Jamnagar (Reliance Marine)', district: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lng: 70.0577, type: 'beach' },
  { name: 'Gandhinagar (Capital)', district: 'Gandhinagar', state: 'Gujarat', lat: 23.2156, lng: 72.6369, type: 'work' },
  { name: 'Junagadh (Girnar)', district: 'Junagadh', state: 'Gujarat', lat: 21.5222, lng: 70.4579, type: 'destination' },
  { name: 'Anand (Milk Capital)', district: 'Anand', state: 'Gujarat', lat: 22.5645, lng: 72.9289, type: 'farm' },
  { name: 'Bhuj (Kutch)', district: 'Kutch', state: 'Gujarat', lat: 23.2420, lng: 69.6669, type: 'destination' },
  { name: 'Porbandar', district: 'Porbandar', state: 'Gujarat', lat: 21.6417, lng: 69.6293, type: 'beach' },

  // --- Rajasthan ---
  { name: 'Jaipur (Pink City)', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, type: 'destination' },
  { name: 'Jodhpur (Sun City)', district: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, type: 'destination' },
  { name: 'Kota (Chambal Basin)', district: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648, type: 'work' },
  { name: 'Bikaner (Thar Desert)', district: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119, type: 'destination' },
  { name: 'Ajmer (Dargah / Pushkar)', district: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399, type: 'destination' },
  { name: 'Udaipur (City of Lakes)', district: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125, type: 'destination' },
  { name: 'Bhilwara', district: 'Bhilwara', state: 'Rajasthan', lat: 25.3407, lng: 74.6313, type: 'work' },
  { name: 'Alwar', district: 'Alwar', state: 'Rajasthan', lat: 27.5530, lng: 76.6346, type: 'custom' },
  { name: 'Bharatpur (Keoladeo Bird Sanctuary)', district: 'Bharatpur', state: 'Rajasthan', lat: 27.2152, lng: 77.5030, type: 'destination' },
  { name: 'Sikar (Shekhawati)', district: 'Sikar', state: 'Rajasthan', lat: 27.6094, lng: 75.1398, type: 'custom' },
  { name: 'Mount Abu (Aravalli Range)', district: 'Sirohi', state: 'Rajasthan', lat: 24.5926, lng: 72.7156, type: 'destination' },
  { name: 'Sri Ganganagar', district: 'Sri Ganganagar', state: 'Rajasthan', lat: 29.9038, lng: 73.8772, type: 'farm' },

  // --- Uttar Pradesh ---
  { name: 'Lucknow (Amausi)', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.7606, lng: 80.8893, type: 'home' },
  { name: 'Kanpur', district: 'Kanpur Nagar', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, type: 'work' },
  { name: 'Varanasi (Kashi / Ghats)', district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, type: 'destination' },
  { name: 'Prayagraj (Allahabad Sangam)', district: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463, type: 'destination' },
  { name: 'Agra (Taj Mahal)', district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, type: 'destination' },
  { name: 'Meerut', district: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064, type: 'work' },
  { name: 'Bareilly', district: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304, type: 'custom' },
  { name: 'Aligarh', district: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880, type: 'work' },
  { name: 'Rampur', district: 'Rampur', state: 'Uttar Pradesh', lat: 28.8154, lng: 79.0250, type: 'custom' },
  { name: 'Moradabad (Brass City)', district: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8351, lng: 78.7747, type: 'work' },
  { name: 'Saharanpur', district: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9671, lng: 77.5510, type: 'farm' },
  { name: 'Gorakhpur (Eastern UP)', district: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732, type: 'home' },
  { name: 'Jhansi (Bundelkhand)', district: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lng: 78.5685, type: 'destination' },
  { name: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', lat: 29.4727, lng: 77.7085, type: 'farm' },
  { name: 'Mathura (Braj)', district: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737, type: 'destination' },
  { name: 'Ayodhya (Ram Janmabhoomi)', district: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998, type: 'destination' },
  { name: 'Firozabad (Glass City)', district: 'Firozabad', state: 'Uttar Pradesh', lat: 27.1592, lng: 78.3957, type: 'work' },

  // --- Kerala ---
  { name: 'Thiruvananthapuram (IMD Trivandrum)', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, type: 'destination' },
  { name: 'Kochi (Port / Coastal Cochin)', district: 'Ernakulam', state: 'Kerala', lat: 9.9312, lng: 76.2673, type: 'beach' },
  { name: 'Kozhikode (Calicut)', district: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804, type: 'beach' },
  { name: 'Thrissur (Cultural Capital)', district: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144, type: 'destination' },
  { name: 'Kollam (Ashtamudi Lake)', district: 'Kollam', state: 'Kerala', lat: 8.8932, lng: 76.6141, type: 'beach' },
  { name: 'Alappuzha (Alleppey Backwaters)', district: 'Alappuzha', state: 'Kerala', lat: 9.4981, lng: 76.3388, type: 'beach' },
  { name: 'Kottayam', district: 'Kottayam', state: 'Kerala', lat: 9.5916, lng: 76.5222, type: 'farm' },
  { name: 'Kannur', district: 'Kannur', state: 'Kerala', lat: 11.8745, lng: 75.3704, type: 'beach' },
  { name: 'Palakkad (Gap)', district: 'Palakkad', state: 'Kerala', lat: 10.7867, lng: 76.6548, type: 'farm' },

  // --- Andhra Pradesh ---
  { name: 'Visakhapatnam (Vizag Port)', district: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, type: 'beach' },
  { name: 'Vijayawada (Krishna River)', district: 'NTR', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, type: 'work' },
  { name: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365, type: 'farm' },
  { name: 'Tirupati (Venkateswara Hills)', district: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192, type: 'destination' },
  { name: 'Rajahmundry (Godavari)', district: 'East Godavari', state: 'Andhra Pradesh', lat: 17.0005, lng: 81.8040, type: 'custom' },
  { name: 'Kakinada (Deepwater Port)', district: 'Kakinada', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475, type: 'beach' },
  { name: 'Nellore', district: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lng: 79.9865, type: 'custom' },
  { name: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373, type: 'custom' },

  // --- Odisha ---
  { name: 'Bhubaneswar (Coastal Odisha)', district: 'Khordha', state: 'Odisha', lat: 20.2961, lng: 85.8245, type: 'destination' },
  { name: 'Cuttack (Mahanadi)', district: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828, type: 'work' },
  { name: 'Puri (Golden Beach / Jagannath)', district: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312, type: 'beach' },
  { name: 'Rourkela (Steel City)', district: 'Sundargarh', state: 'Odisha', lat: 22.2604, lng: 84.8536, type: 'work' },
  { name: 'Sambalpur (Hirakud Dam)', district: 'Sambalpur', state: 'Odisha', lat: 21.4669, lng: 83.9812, type: 'farm' },
  { name: 'Berhampur (Ganjam)', district: 'Ganjam', state: 'Odisha', lat: 19.3150, lng: 84.7941, type: 'beach' },
  { name: 'Balasore (Chandipur Coast)', district: 'Balasore', state: 'Odisha', lat: 21.4934, lng: 86.9135, type: 'beach' },
  { name: 'Baripada (Mayurbhanj)', district: 'Mayurbhanj', state: 'Odisha', lat: 21.9333, lng: 86.7333, type: 'destination' },

  // --- Madhya Pradesh ---
  { name: 'Bhopal (City of Lakes)', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, type: 'home' },
  { name: 'Indore (Cleanest City)', district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, type: 'work' },
  { name: 'Jabalpur (Bhedaghat / Narmada)', district: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864, type: 'destination' },
  { name: 'Gwalior (Fort City)', district: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828, type: 'destination' },
  { name: 'Ujjain (Mahakaleshwar)', district: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885, type: 'destination' },
  { name: 'Sagar', district: 'Sagar', state: 'Madhya Pradesh', lat: 23.8388, lng: 78.7378, type: 'custom' },
  { name: 'Rewa (Vindhya)', district: 'Rewa', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3037, type: 'custom' },
  { name: 'Satna', district: 'Satna', state: 'Madhya Pradesh', lat: 24.5824, lng: 80.8322, type: 'custom' },
  { name: 'Ratlam', district: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3315, lng: 75.0367, type: 'farm' },

  // --- Bihar ---
  { name: 'Patna (Airport / Ganga)', district: 'Patna', state: 'Bihar', lat: 25.5913, lng: 85.0880, type: 'custom' },
  { name: 'Gaya (Bodh Gaya)', district: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002, type: 'destination' },
  { name: 'Bhagalpur (Silk City)', district: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842, type: 'custom' },
  { name: 'Muzaffarpur (Shahi Litchi)', district: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647, type: 'farm' },
  { name: 'Darbhanga (Mithila)', district: 'Darbhanga', state: 'Bihar', lat: 26.1542, lng: 85.8918, type: 'destination' },
  { name: 'Purnia (Seemanchal)', district: 'Purnia', state: 'Bihar', lat: 25.7771, lng: 87.4753, type: 'custom' },
  { name: 'Bihar Sharif', district: 'Nalanda', state: 'Bihar', lat: 25.1982, lng: 85.5149, type: 'custom' },
  { name: 'Arrah', district: 'Bhojpur', state: 'Bihar', lat: 25.5541, lng: 84.6631, type: 'custom' },

  // --- Punjab & Chandigarh ---
  { name: 'Chandigarh (Capitol Complex)', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, type: 'home' },
  { name: 'Amritsar (Golden Temple)', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723, type: 'destination' },
  { name: 'Ludhiana (Industrial Hub)', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573, type: 'work' },
  { name: 'Jalandhar', district: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762, type: 'work' },
  { name: 'Patiala (Heritage)', district: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869, type: 'destination' },
  { name: 'Bathinda', district: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455, type: 'custom' },
  { name: 'Mohali (SAS Nagar)', district: 'Sahibzada Ajit Singh Nagar', state: 'Punjab', lat: 30.7046, lng: 76.7179, type: 'work' },
  { name: 'Pathankot', district: 'Pathankot', state: 'Punjab', lat: 32.2689, lng: 75.6499, type: 'destination' },

  // --- Haryana ---
  { name: 'Panipat (Textile City)', district: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635, type: 'work' },
  { name: 'Ambala (Twin City)', district: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767, type: 'work' },
  { name: 'Rohtak', district: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066, type: 'custom' },
  { name: 'Hisar (Agro Hub)', district: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217, type: 'farm' },
  { name: 'Karnal (Rice Bowl)', district: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905, type: 'farm' },
  { name: 'Sonipat', district: 'Sonipat', state: 'Haryana', lat: 28.9931, lng: 77.0151, type: 'custom' },
  { name: 'Panchkula', district: 'Panchkula', state: 'Haryana', lat: 30.6942, lng: 76.8606, type: 'home' },

  // --- Himachal Pradesh ---
  { name: 'Shimla (Hill Station / Capital)', district: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, type: 'destination' },
  { name: 'Dharamshala (Kangra Valley)', district: 'Kangra', state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234, type: 'destination' },
  { name: 'Manali (Beas River Valley)', district: 'Kullu', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892, type: 'destination' },
  { name: 'Kullu (Valley of Gods)', district: 'Kullu', state: 'Himachal Pradesh', lat: 31.9579, lng: 77.1095, type: 'destination' },
  { name: 'Solan (Mushroom City)', district: 'Solan', state: 'Himachal Pradesh', lat: 30.9045, lng: 77.0967, type: 'custom' },
  { name: 'Mandi', district: 'Mandi', state: 'Himachal Pradesh', lat: 31.5892, lng: 76.9182, type: 'custom' },
  { name: 'Dalhousie', district: 'Chamba', state: 'Himachal Pradesh', lat: 32.5387, lng: 75.9710, type: 'destination' },

  // --- Uttarakhand ---
  { name: 'Dehradun (Doon Valley)', district: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, type: 'custom' },
  { name: 'Haridwar (Ganga Har Ki Pauri)', district: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642, type: 'destination' },
  { name: 'Rishikesh (Yoga Capital)', district: 'Dehradun', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676, type: 'destination' },
  { name: 'Nainital (Lake District)', district: 'Nainital', state: 'Uttarakhand', lat: 29.3919, lng: 79.4542, type: 'destination' },
  { name: 'Mussoorie (Queen of Hills)', district: 'Dehradun', state: 'Uttarakhand', lat: 30.4598, lng: 78.0644, type: 'destination' },
  { name: 'Haldwani', district: 'Nainital', state: 'Uttarakhand', lat: 29.2183, lng: 79.5130, type: 'work' },
  { name: 'Roorkee (IIT Station)', district: 'Haridwar', state: 'Uttarakhand', lat: 29.8543, lng: 77.8880, type: 'work' },

  // --- Jammu and Kashmir & Ladakh ---
  { name: 'Srinagar (Dal Lake / Kashmir)', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973, type: 'destination' },
  { name: 'Jammu (Winter Capital)', district: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.8570, type: 'home' },
  { name: 'Gulmarg (Ski Resort)', district: 'Baramulla', state: 'Jammu and Kashmir', lat: 34.0484, lng: 74.3805, type: 'destination' },
  { name: 'Pahalgam (Lidder Valley)', district: 'Anantnag', state: 'Jammu and Kashmir', lat: 34.0125, lng: 75.3239, type: 'destination' },
  { name: 'Leh (High Altitude Desert)', district: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771, type: 'destination' },
  { name: 'Kargil', district: 'Kargil', state: 'Ladakh', lat: 34.5539, lng: 76.1349, type: 'destination' },

  // --- Assam & North East ---
  { name: 'Guwahati (Brahmaputra Basin)', district: 'Kamrup Metropolitan', state: 'Assam', lat: 26.1445, lng: 91.7362, type: 'destination' },
  { name: 'Silchar (Barak Valley)', district: 'Cachar', state: 'Assam', lat: 24.8333, lng: 92.7789, type: 'custom' },
  { name: 'Dibrugarh (Tea City)', district: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120, type: 'farm' },
  { name: 'Jorhat (Tea Research)', district: 'Jorhat', state: 'Assam', lat: 26.7509, lng: 94.2037, type: 'farm' },
  { name: 'Shillong (Scotland of East)', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, type: 'destination' },
  { name: 'Cherrapunji (Sohra)', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.2744, lng: 91.7323, type: 'destination' },
  { name: 'Agartala (Tripura Capital)', district: 'West Tripura', state: 'Tripura', lat: 23.8315, lng: 91.2868, type: 'custom' },
  { name: 'Aizawl', district: 'Aizawl', state: 'Mizoram', lat: 23.7307, lng: 92.7173, type: 'destination' },
  { name: 'Imphal', district: 'Imphal West', state: 'Manipur', lat: 24.8170, lng: 93.9368, type: 'destination' },
  { name: 'Kohima', district: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086, type: 'destination' },
  { name: 'Gangtok (Kanchenjunga)', district: 'East Sikkim', state: 'Sikkim', lat: 27.3389, lng: 88.6065, type: 'destination' },
  { name: 'Itanagar', district: 'Papum Pare', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, type: 'destination' },

  // --- Jharkhand & Chhattisgarh ---
  { name: 'Ranchi (Jharkhand Capital)', district: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, type: 'home' },
  { name: 'Jamshedpur (Tata Steel)', district: 'East Singhbhum', state: 'Jharkhand', lat: 22.8046, lng: 86.2029, type: 'work' },
  { name: 'Dhanbad (Coal Capital)', district: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304, type: 'work' },
  { name: 'Bokaro Steel City', district: 'Bokaro', state: 'Jharkhand', lat: 23.6693, lng: 86.1511, type: 'work' },
  { name: 'Deoghar (Baba Baidyanath)', district: 'Deoghar', state: 'Jharkhand', lat: 24.4826, lng: 86.7001, type: 'destination' },
  { name: 'Raipur (Capital)', district: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, type: 'home' },
  { name: 'Bhilai (Steel Plant)', district: 'Durg', state: 'Chhattisgarh', lat: 21.1938, lng: 81.3509, type: 'work' },
  { name: 'Bilaspur', district: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409, type: 'custom' },
  { name: 'Korba (Power Capital)', district: 'Korba', state: 'Chhattisgarh', lat: 22.3595, lng: 82.7501, type: 'work' },

  // --- Goa & Island Territories ---
  { name: 'Panaji (Goa Capital)', district: 'North Goa', state: 'Goa', lat: 15.4909, lng: 73.8278, type: 'beach' },
  { name: 'Margao (South Goa)', district: 'South Goa', state: 'Goa', lat: 15.2832, lng: 73.9862, type: 'beach' },
  { name: 'Vasco da Gama (Mormugao Port)', district: 'South Goa', state: 'Goa', lat: 15.3982, lng: 73.8113, type: 'beach' },
  { name: 'Port Blair (Andaman Sea)', district: 'South Andaman', state: 'Andaman and Nicobar', lat: 11.6234, lng: 92.7265, type: 'beach' },
  { name: 'Puducherry (French Quarter)', district: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083, type: 'beach' },
  { name: 'Kavaratti (Coral Atoll)', district: 'Lakshadweep', state: 'Lakshadweep', lat: 10.5667, lng: 72.6417, type: 'beach' },
  { name: 'Daman (Coastal Fortress)', district: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.3974, lng: 72.8328, type: 'beach' },
  { name: 'Diu (Island)', district: 'Diu', state: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.7144, lng: 70.9874, type: 'beach' }
];

// In-memory cache for dynamic geocoded queries
const GEOCODING_CACHE = new Map<string, IndianCity[]>();

/**
 * Searches across the extensive local directory, and seamlessly queries
 * the Open-Meteo Geocoding API if broader coverage across all towns/villages is required.
 */
export async function searchAllIndianCities(query: string, limit = 15): Promise<IndianCity[]> {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return INDIAN_CITIES_CATALOG.slice(0, limit);
  }

  // 1. First, search our curated high-accuracy catalog
  const localMatches = INDIAN_CITIES_CATALOG.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
    );
  });

  if (localMatches.length >= limit) {
    return localMatches.slice(0, limit);
  }

  // 2. Check geocoding cache
  if (GEOCODING_CACHE.has(q)) {
    const cached = GEOCODING_CACHE.get(q)!;
    return mergeUniqueCities(localMatches, cached).slice(0, limit);
  }

  // 3. Dynamic lookup from Open-Meteo geocoding API filtered to India
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&country_code=IN&count=10&language=en&format=json`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        const remoteMatches: IndianCity[] = data.results.map((r: any) => {
          const state = cleanStateName(r.admin1 || 'India');
          const district = cleanDistrictName(r.admin2 || r.name);
          const name = `${r.name} (${district !== r.name ? district + ', ' : ''}${state})`;
          return {
            name,
            district,
            state,
            lat: parseFloat(r.latitude),
            lng: parseFloat(r.longitude),
            type: 'custom'
          };
        });

        GEOCODING_CACHE.set(q, remoteMatches);
        return mergeUniqueCities(localMatches, remoteMatches).slice(0, limit);
      }
    }
  } catch (err) {
    // If external geocoder fails or times out, fallback seamlessly to local matches
  }

  return localMatches.slice(0, limit);
}

/**
 * Resolves or infers district and state for any Indian location name or coordinates
 */
export function resolveLocationJurisdiction(
  locationName: string,
  latitude?: number,
  longitude?: number,
  fallbackDistrict?: string,
  fallbackState?: string
): { district: string; state: string } {
  if (fallbackDistrict && fallbackState) {
    return { district: fallbackDistrict, state: fallbackState };
  }

  const cleanName = (locationName || '').toLowerCase().trim();

  // Match by location name in catalog
  const foundByName = INDIAN_CITIES_CATALOG.find((c) => {
    const cName = c.name.toLowerCase();
    const cDist = c.district.toLowerCase();
    return (
      cleanName === cName ||
      cleanName.includes(cDist) ||
      cName.includes(cleanName) ||
      cDist.includes(cleanName)
    );
  });

  if (foundByName) {
    return { district: foundByName.district, state: foundByName.state };
  }

  // Match by proximity if coordinates are supplied
  if (latitude !== undefined && longitude !== undefined) {
    let closestCity = INDIAN_CITIES_CATALOG[0];
    let minDistanceSq = Number.MAX_VALUE;

    for (const city of INDIAN_CITIES_CATALOG) {
      const dLat = city.lat - latitude;
      const dLng = city.lng - longitude;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestCity = city;
      }
    }

    // Within ~1.5 degrees (~150km)
    if (minDistanceSq < 2.25) {
      return { district: closestCity.district, state: closestCity.state };
    }
  }

  return {
    district: fallbackDistrict || locationName || 'New Delhi',
    state: fallbackState || 'Delhi'
  };
}

function cleanStateName(rawState: string): string {
  if (/National Capital Territory of Delhi/i.test(rawState)) return 'Delhi';
  if (/Odisha/i.test(rawState) || /Orissa/i.test(rawState)) return 'Odisha';
  return rawState.replace(/\s+State$/i, '').trim();
}

function cleanDistrictName(rawDistrict: string): string {
  return rawDistrict.replace(/\s+District$/i, '').trim();
}

function mergeUniqueCities(a: IndianCity[], b: IndianCity[]): IndianCity[] {
  const seen = new Set<string>();
  const out: IndianCity[] = [];

  for (const item of [...a, ...b]) {
    const key = `${item.lat.toFixed(2)},${item.lng.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }

  return out;
}

/**
 * Resolves a full IndianCity object (including coordinates and district) by city name or query.
 * Checks catalog first, then fuzzy match, then geocoder fallback.
 */
export async function resolveCityInfo(cityNameOrQuery: string): Promise<IndianCity | undefined> {
  if (!cityNameOrQuery || !cityNameOrQuery.trim()) return undefined;
  const clean = cityNameOrQuery.trim().toLowerCase();

  // 1. Exact or starts-with match in catalog
  const foundExact = INDIAN_CITIES_CATALOG.find((c) => {
    const cName = c.name.toLowerCase();
    const cDist = c.district.toLowerCase();
    return cName === clean || cDist === clean || cName.startsWith(clean) || clean.startsWith(cDist);
  });
  if (foundExact) return foundExact;

  // 2. Contains match in catalog
  const foundContains = INDIAN_CITIES_CATALOG.find((c) => {
    const cName = c.name.toLowerCase();
    const cDist = c.district.toLowerCase();
    return cName.includes(clean) || cDist.includes(clean) || clean.includes(cName) || clean.includes(cDist);
  });
  if (foundContains) return foundContains;

  // 3. Fallback to geocoder search
  try {
    const remote = await searchAllIndianCities(cityNameOrQuery, 1);
    if (remote && remote.length > 0) {
      return remote[0];
    }
  } catch (err) {
    // ignore
  }

  return undefined;
}

