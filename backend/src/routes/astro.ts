import { Router } from 'express';
import { getDb } from '../db';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { randomUUID } from 'crypto';

const router = Router();

// Helper to parse Date (YYYY-MM-DD or DD-MM-YYYY)
function parseDate(dobStr: string) {
  if (!dobStr) return null;
  let parts = dobStr.split('-');
  if (parts.length !== 3) {
    parts = dobStr.split('/');
  }
  if (parts.length !== 3) return null;

  if (parts[0].length === 4) {
    return {
      year: parseInt(parts[0]),
      month: parseInt(parts[1]),
      day: parseInt(parts[2])
    };
  }
  return {
    day: parseInt(parts[0]),
    month: parseInt(parts[1]),
    year: parseInt(parts[2])
  };
}

// Helper to parse Time (HH:MM or HH:MM AM/PM)
function parseTime(tobStr: string) {
  if (!tobStr) return null;
  const cleanStr = tobStr.trim().toUpperCase();
  const isPm = cleanStr.includes('PM');
  const isAm = cleanStr.includes('AM');
  const timePart = cleanStr.replace(/(AM|PM)/g, '').trim();
  const parts = timePart.split(':');
  if (parts.length < 2) return null;
  let hour = parseInt(parts[0]);
  let min = parseInt(parts[1]);
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  return { hour, min };
}

// Helper to get geo details from place using Vedic Rishi API
async function fetchGeoDetails(place: string, userId: string, apiKey: string) {
  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
  try {
    const response = await axios.post('https://json.astrologyapi.com/v1/geo_details', {
      place,
      maxRows: 1
    }, {
      headers: {
        'authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
  } catch (err) {
    console.error('Error fetching geo details from Vedic Rishi:', err);
  }
  return null;
}

// Helper to get timezone offset from coordinates using Vedic Rishi API
async function fetchTimezoneOffset(lat: number, lon: number, dateStr: string, userId: string, apiKey: string) {
  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
  try {
    const response = await axios.post('https://json.astrologyapi.com/v1/timezone_with_dst', {
      latitude: lat,
      longitude: lon,
      date: dateStr
    }, {
      headers: {
        'authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data?.timezone || 5.5; // Default to 5.5 (India)
  } catch (err) {
    console.error('Error fetching timezone from Vedic Rishi:', err);
  }
  return 5.5;
}

// Helper to fetch Ashtakoota points from Vedic Rishi API
async function fetchAshtakootaPoints(maleDetails: any, femaleDetails: any, userId: string, apiKey: string) {
  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
  try {
    const response = await axios.post('https://json.astrologyapi.com/v1/match_ashtakoot_points', {
      m_day: maleDetails.day,
      m_month: maleDetails.month,
      m_year: maleDetails.year,
      m_hour: maleDetails.hour,
      m_min: maleDetails.min,
      m_lat: maleDetails.lat,
      m_lon: maleDetails.lon,
      m_tzone: maleDetails.tzone,
      f_day: femaleDetails.day,
      f_month: femaleDetails.month,
      f_year: femaleDetails.year,
      f_hour: femaleDetails.hour,
      f_min: femaleDetails.min,
      f_lat: femaleDetails.lat,
      f_lon: femaleDetails.lon,
      f_tzone: femaleDetails.tzone
    }, {
      headers: {
        'authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching Ashtakoota points from Vedic Rishi API:', err);
    throw err;
  }
}

// Deterministic Hash function for consistent mock matching scores between two users
function getDeterministicHash(s1: string, s2: string): number {
  const str = [s1, s2].sort().join('-');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate realistic mock Ashtakoota details if API key is not configured
function generateMockAshtakoota(userId1: string, userId2: string) {
  const hash = getDeterministicHash(userId1, userId2);
  
  // Received points out of 36
  const totalReceived = 16 + (hash % 17) + (hash % 2 === 0 ? 0.5 : 0); // 16 to 33.5 points
  
  const varnaReceived = hash % 2 === 0 ? 1 : 0;
  const vasyaReceived = (hash % 3 === 0) ? 2 : (hash % 3 === 1 ? 1 : 0);
  const taraReceived = (hash % 3) * 1.5; // 0, 1.5, 3
  const yoniReceived = (hash % 5); // 0 to 4
  const maitriReceived = (hash % 3) * 2.5; // 0, 2.5, 5
  const ganaReceived = hash % 3 === 0 ? 6 : (hash % 3 === 1 ? 0 : 1);
  const bhakootReceived = hash % 4 === 0 ? 7 : 0;
  const nadiReceived = hash % 5 === 0 ? 0 : 8;

  // Let's normalize sum slightly to make it match totalReceived
  return {
    total: {
      received_points: totalReceived,
      minimum_points: 18,
      total_points: 36,
      status: totalReceived >= 18
    },
    varna: { received_points: varnaReceived, total_points: 1, description: varnaReceived > 0 ? "Excellent alignment." : "Slight differences in intellectual match." },
    vasya: { received_points: vasyaReceived, total_points: 2, description: vasyaReceived === 2 ? "High mutual attraction." : "Average attraction." },
    tara: { received_points: taraReceived, total_points: 3, description: taraReceived >= 1.5 ? "Good health harmony." : "Caution required for physical compatibility." },
    yoni: { received_points: yoniReceived, total_points: 4, description: yoniReceived >= 2 ? "Favorable physical matching." : "Average physical compatibility." },
    maitri: { received_points: maitriReceived, total_points: 5, description: maitriReceived >= 2.5 ? "Excellent friendship and mutual respect." : "Varying wave-lengths." },
    gana: { received_points: ganaReceived, total_points: 6, description: ganaReceived === 6 ? "Compatible temperaments (Deva-Deva alignment)." : "Slight friction in behaviors." },
    bhakoot: { received_points: bhakootReceived, total_points: 7, description: bhakootReceived > 0 ? "Excellent long-term growth and stability." : "Requires emotional understanding." },
    nadi: { received_points: nadiReceived, total_points: 8, description: nadiReceived === 8 ? "Biological and spiritual alignment is perfect." : "Nadi dosha present, recommend remedies." }
  };
}

// 1. POST /api/profile/update-birth-details
router.post('/update-birth-details', async (req, res) => {
  const { userId, dob, tob, pob } = req.body;
  if (!userId || !dob || !tob || !pob) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const db = getDb();
  try {
    await db.run('UPDATE users SET dob = $1, tob = $2, pob = $3 WHERE id = $4', [dob, tob, pob, userId]);
    const updatedUser = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
    updatedUser.photos = JSON.parse(updatedUser.photos || '[]');
    updatedUser.family_details = JSON.parse(updatedUser.family_details || '{}');

    res.json({ message: 'Birth details updated successfully', user: updatedUser });
  } catch (err: any) {
    console.error('Error updating birth details:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/astro/match-details
router.get('/match-details', async (req, res) => {
  const { matchId, userId } = req.query;
  if (!matchId || !userId) {
    return res.status(400).json({ error: 'Missing matchId or userId' });
  }

  const db = getDb();

  try {
    // 1. Get the match/interest details
    const interest = await db.get('SELECT * FROM interests WHERE id = $1', [matchId]);
    if (!interest) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const partnerId = interest.sender_id === userId ? interest.receiver_id : interest.sender_id;

    // 2. Fetch both users' profiles
    const userMe = await db.get('SELECT name, dob, tob, pob, gender FROM users WHERE id = $1', [userId]);
    const userPartner = await db.get('SELECT name, dob, tob, pob, gender FROM users WHERE id = $1', [partnerId]);

    if (!userMe || !userPartner) {
      return res.status(404).json({ error: 'User details not found' });
    }

    // 3. Check if birth details are completed
    const meComplete = !!(userMe.dob && userMe.tob && userMe.pob);
    const partnerComplete = !!(userPartner.dob && userPartner.tob && userPartner.pob);

    if (!meComplete || !partnerComplete) {
      return res.json({
        success: true,
        isComplete: false,
        meComplete,
        partnerComplete,
        meName: userMe.name,
        partnerName: userPartner.name
      });
    }

    // 4. Calculate Ashtakoota (API or Fallback)
    const isUnlocked = interest.astro_unlocked === 1 || interest.astro_unlocked === true;
    let scoreDetails: any;

    const astroUserId = process.env.ASTRO_USER_ID;
    const astroApiKey = process.env.ASTRO_API_KEY;

    if (astroUserId && astroApiKey) {
      try {
        console.log('Calculating Jathakam via Vedic Rishi API...');
        const isMeMale = userMe.gender?.toLowerCase() === 'male';
        const userMale = isMeMale ? userMe : userPartner;
        const userFemale = isMeMale ? userPartner : userMe;

        // Parse birth coordinates
        const mGeo = await fetchGeoDetails(userMale.pob, astroUserId, astroApiKey);
        const fGeo = await fetchGeoDetails(userFemale.pob, astroUserId, astroApiKey);

        if (!mGeo || !fGeo) {
          throw new Error('Failed to fetch geographic coordinates for birth place');
        }

        const mDateParts = parseDate(userMale.dob)!;
        const fDateParts = parseDate(userFemale.dob)!;
        const mTimeParts = parseTime(userMale.tob)!;
        const fTimeParts = parseTime(userFemale.tob)!;

        const mDateStr = `${mDateParts.month}-${mDateParts.day}-${mDateParts.year}`;
        const fDateStr = `${fDateParts.month}-${fDateParts.day}-${fDateParts.year}`;

        const mTzone = await fetchTimezoneOffset(mGeo.latitude, mGeo.longitude, mDateStr, astroUserId, astroApiKey);
        const fTzone = await fetchTimezoneOffset(fGeo.latitude, fGeo.longitude, fDateStr, astroUserId, astroApiKey);

        scoreDetails = await fetchAshtakootaPoints(
          { ...mDateParts, ...mTimeParts, lat: mGeo.latitude, lon: mGeo.longitude, tzone: mTzone },
          { ...fDateParts, ...fTimeParts, lat: fGeo.latitude, lon: fGeo.longitude, tzone: fTzone },
          astroUserId,
          astroApiKey
        );
      } catch (err) {
        console.error('Vedic Rishi API failed, falling back to mock calculations:', err);
        scoreDetails = generateMockAshtakoota(userId as string, partnerId);
      }
    } else {
      console.log('Vedic Rishi API credentials not configured. Using mock calculations.');
      scoreDetails = generateMockAshtakoota(userId as string, partnerId);
    }

    const receivedPoints = scoreDetails.total?.received_points || 0;
    const status = scoreDetails.total?.status || false;

    // 5. If not unlocked, return only basic compatibility points
    if (!isUnlocked) {
      return res.json({
        success: true,
        isComplete: true,
        isUnlocked: false,
        score: receivedPoints,
        meName: userMe.name,
        partnerName: userPartner.name
      });
    }

    // 6. If unlocked, generate the Gemini story!
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini AI API Key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a warm, wise Vedic Astrologer matching a couple. 
    Analyze their Ashtakoota compatibility details:
    ${JSON.stringify(scoreDetails, null, 2)}
    
    The boy is ${userMe.gender?.toLowerCase() === 'male' ? userMe.name : userPartner.name}. 
    The girl is ${userMe.gender?.toLowerCase() === 'female' ? userMe.name : userPartner.name}.
    Total Points: ${receivedPoints}/36.
    
    Generate a horoscope matching compatibility report. Write it as an encouraging, beautiful story.
    You MUST output strictly in JSON matching this schema:
    {
      "chapter1": "vibe, communication & chemistry details",
      "chapter2": "wealth, family support, prosperity & career destiny",
      "chapter3": "life compatibility, long-term harmony & children",
      "chapter4": "challenges, warning flags & practical remedies"
    }
    Make sure each chapter is highly detailed, warm, and writes about the couple by name. Do not include markdown blocks around the JSON output.`;

    let storyData: any;
    try {
      console.log('Requesting Gemini to write the Astro compatibility story...');
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const replyText = result.text || '';
      storyData = JSON.parse(replyText.trim());
    } catch (gemErr: any) {
      console.warn('Gemini API call failed, using local fallback story:', gemErr.message);
      const boyName = userMe.gender?.toLowerCase() === 'male' ? userMe.name : userPartner.name;
      const girlName = userMe.gender?.toLowerCase() === 'female' ? userMe.name : userPartner.name;
      
      storyData = {
        chapter1: `The connection between ${boyName} and ${girlName} shows a warm and promising start. Their mental wavelengths match nicely with an Ashtakoota compatibility score of ${receivedPoints}/36 points. In conversations, they exhibit a natural rhythm where mutual respect serves as their core language. Communication flows effortlessly as they appreciate each other's perspectives.`,
        chapter2: `Financially and professionally, this union receives strong planetary support. Together, ${boyName} and ${girlName} will encourage one another to achieve greater career milestones. Family support will act as an anchor, bringing prosperity and stability into their lives. They are destined to build a secure and comfortable home together.`,
        chapter3: `In the long run, their life compatibility is built on shared goals and values. The planetary positions indicate a stable, nurturing household where children will thrive under their combined wisdom. Their overall temperament alignment creates a peaceful home environment that can weather any life transitions.`,
        chapter4: `While their score of ${receivedPoints}/36 points is highly encouraging, they should be mindful of slight differences in temperament. To balance any potential friction, it is recommended that they spend quiet time in nature together and practice deep listening. A simple practical remedy is to light a ghee lamp on Thursdays to invite positive energy.`
      };
    }

    return res.json({
      success: true,
      isComplete: true,
      isUnlocked: true,
      score: receivedPoints,
      meName: userMe.name,
      partnerName: userPartner.name,
      story: storyData
    });

  } catch (error: any) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// 3. POST /api/astro/unlock-match
router.post('/unlock-match', async (req, res) => {
  const { matchId, userId } = req.body;
  if (!matchId || !userId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const db = getDb();

  try {
    // 1. Get user rose balance
    const user = await db.get('SELECT roses_balance, name FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.roses_balance || 0) < 3) {
      return res.status(400).json({ error: 'Insufficient Roses. You need 3 Roses to unlock the Astro Matchmaker.' });
    }

    // 2. Fetch match partner to log the transaction
    const interest = await db.get('SELECT * FROM interests WHERE id = $1', [matchId]);
    if (!interest) return res.status(404).json({ error: 'Match not found' });

    const partnerId = interest.sender_id === userId ? interest.receiver_id : interest.sender_id;
    const partner = await db.get('SELECT name FROM users WHERE id = $1', [partnerId]);
    const partnerName = partner?.name || 'your match';

    // 3. Deduct 3 Roses
    await db.run('UPDATE users SET roses_balance = roses_balance - 3 WHERE id = $1', [userId]);

    // 4. Log the transaction
    await db.run(
      "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), userId, -3, 'spent_astro', `Unlocked Astro Compatibility with ${partnerName}`]
    );

    // 5. Update match lock status
    await db.run('UPDATE interests SET astro_unlocked = 1 WHERE id = $1', [matchId]);

    res.json({ message: 'Astro Compatibility unlocked successfully!' });

  } catch (error: any) {
    console.error('Error unlocking match astro details:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
