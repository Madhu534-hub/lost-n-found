import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      brandName: 'TraceIt',
      tagline: 'Campus AI Lost & Found',
      nav: {
        home: 'Home',
        explore: 'Explore Items',
        photoSearch: 'Search by Photo',
        report: 'Report Item',
        myReports: 'My Radar',
        leaderboard: 'Campus Heroes',
        admin: 'Security Admin',
        help: 'How It Works'
      },
      hero: {
        title: 'Campus Lost & Found,',
        titleHighlight: 'Reinvented by AI.',
        subtitle: 'Find your misplaced belongings or help a classmate. Fast, secure, and explainable.',
        reportLostBtn: 'Report Lost Item',
        reportFoundBtn: 'Report Found Item',
        searchPhotoBtn: 'Search by Photo',
        exploreBtn: 'Explore Catalog'
      },
      wizard: {
        step1Title: 'Step 1: Add a Photo',
        step1Desc: 'Upload a picture of the item (or pick a sample below).',
        step2Title: 'Step 2: Describe the Item',
        step2Desc: 'Tell us the title, category, and what it looks like.',
        step3Title: 'Step 3: Where & When',
        step3Desc: 'Tell us the campus building and approximate time.',
        nextBtn: 'Next Step →',
        prevBtn: '← Back',
        submitBtn: 'Submit & Scan for Matches'
      },
      voice: {
        start: 'Speak Description',
        listening: 'Listening... Speak now',
        stop: 'Stop Recording'
      },
      accessibility: {
        howSure: 'How sure we are:',
        valuableBadge: '⭐ Valuable Item',
        serialVerified: 'Verified by Serial Number',
        verifiedHandover: 'Verified Handover ✅',
        translateBtn: '🌐 Translate',
        claimBtn: 'This Is My Item — Verify Claim',
        chatBtn: 'Open Secure Chat',
        qrBtn: 'Show Handover QR Code'
      }
    }
  },
  hi: {
    translation: {
      brandName: 'ट्रेस-इट (TraceIt)',
      tagline: 'कैम्पस एआई खोया-पाया प्रणाली',
      nav: {
        home: 'होम',
        explore: 'सामान देखें',
        photoSearch: 'फोटो से खोजें',
        report: 'रिपोर्ट दर्ज करें',
        myReports: 'मेरा रडार',
        leaderboard: 'कैम्पस हीरोज़',
        admin: 'सुरक्षा एडमिन',
        help: 'उपयोग गाइड'
      },
      hero: {
        title: 'कैम्पस में खोया सामान,',
        titleHighlight: 'एआई द्वारा तुरंत खोजें।',
        subtitle: 'अपने खोए हुए सामान को वापस पाएं या किसी सहपाठी की मदद करें। सुरक्षित और सरल।',
        reportLostBtn: 'खोया सामान दर्ज करें',
        reportFoundBtn: 'मिला सामान दर्ज करें',
        searchPhotoBtn: 'फोटो से खोजें',
        exploreBtn: 'कैटलॉग देखें'
      },
      wizard: {
        step1Title: 'चरण 1: फोटो जोड़ें',
        step1Desc: 'सामान की तस्वीर अपलोड करें या नीचे दिए गए नमूने चुनें।',
        step2Title: 'चरण 2: विवरण दें',
        step2Desc: 'सामान का नाम, श्रेणी और पहचान बताएं (बोलकर भी लिख सकते हैं)।',
        step3Title: 'चरण 3: स्थान और समय',
        step3Desc: 'कैम्पस भवन और लगभग समय बताएं।',
        nextBtn: 'अगला चरण →',
        prevBtn: '← पीछे जाएं',
        submitBtn: 'दर्ज करें और मैच खोजें'
      },
      voice: {
        start: 'बोलकर लिखें',
        listening: 'सुन रहे हैं... कृपया बोलें',
        stop: 'रिकॉर्डिंग बंद करें'
      },
      accessibility: {
        howSure: 'एआई मिलान निश्चितता:',
        valuableBadge: '⭐ कीमती सामान',
        serialVerified: 'सीरियल नंबर द्वारा सत्यापित',
        verifiedHandover: 'सत्यापित सुपुर्दगी ✅',
        translateBtn: '🌐 अनुवाद करें',
        claimBtn: 'यह मेरा सामान है — दावा सत्यापित करें',
        chatBtn: 'सुरक्षित चैट खोलें',
        qrBtn: 'क्यूआर कोड दिखाएं'
      }
    }
  },
  kn: {
    translation: {
      brandName: 'ಟ್ರೇಸ್‌ಇಟ್ (TraceIt)',
      tagline: 'ಕ್ಯಾಂಪಸ್ ಎಐ ಕಳೆದುಹೋದ-ಸಿಕ್ಕ ವಸ್ತುಗಳ ವೇದಿಕೆ',
      nav: {
        home: 'ಮುಖಪುಟ',
        explore: 'ವಸ್ತುಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
        photoSearch: 'ಫೋಟೋ ಮೂಲಕ ಹುಡುಕಿ',
        report: 'ವರದಿ ಮಾಡಿ',
        myReports: 'ನನ್ನ ರಡಾರ್',
        leaderboard: 'ಕ್ಯಾಂಪಸ್ ಹೀರೋಗಳು',
        admin: 'ಭದ್ರತಾ ನಿರ್ವಾಹಕ',
        help: 'ಮಾರ್ಗದರ್ಶಿ'
      },
      hero: {
        title: 'ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ಕಳೆದುಹೋದ ವಸ್ತುಗಳು,',
        titleHighlight: 'ಎಐ ಮೂಲಕ ಪುನಃ ಪಡೆಯಿರಿ.',
        subtitle: 'ನಿಮ್ಮ ಕಳೆದುಹೋದ ವಸ್ತುಗಳನ್ನು ಸುಲಭವಾಗಿ ಹುಡುಕಿ ಅಥವಾ ಸಹಪಾಠಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡಿ.',
        reportLostBtn: 'ಕಳೆದುಹೋದ ವಸ್ತು ವರದಿ',
        reportFoundBtn: 'ಸಿಕ್ಕ ವಸ್ತು ವರದಿ',
        searchPhotoBtn: 'ಫೋಟೋ ಮೂಲಕ ಹುಡುಕಿ',
        exploreBtn: 'ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ'
      },
      wizard: {
        step1Title: 'ಹಂತ 1: ಫೋಟೋ ಸೇರಿಸಿ',
        step1Desc: 'ವಸ್ತುವಿನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಮಾದರಿ ಆಯ್ಕೆಮಾಡಿ.',
        step2Title: 'ಹಂತ 2: ವಿವರಣೆ ನೀಡಿ',
        step2Desc: 'ವಸ್ತುವಿನ ಹೆಸರು, ವರ್ಗ ಮತ್ತು ವಿವರಣೆ ತಿಳಿಸಿ (ಧ್ವನಿ ಮೂಲಕವೂ ಹೇಳಬಹುದು).',
        step3Title: 'ಹಂತ 3: ಸ್ಥಳ ಮತ್ತು ಸಮಯ',
        step3Desc: 'ಕ್ಯಾಂಪಸ್ ಕಟ್ಟಡ ಮತ್ತು ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
        nextBtn: 'ಮುಂದಿನ ಹಂತ →',
        prevBtn: '← ಹಿಂದಕ್ಕೆ',
        submitBtn: 'ಸಲ್ಲಿಸಿ ಮತ್ತು ಹೊಂದಾಣಿಕೆ ಹುಡುಕಿ'
      },
      voice: {
        start: 'ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ',
        listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... ಮಾತನಾಡಿ',
        stop: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ'
      },
      accessibility: {
        howSure: 'ಹೊಂದಾಣಿಕೆ ನಿಖರತೆ:',
        valuableBadge: '⭐ ಅಮೂಲ್ಯ ವಸ್ತು',
        serialVerified: 'ಸೀರಿಯಲ್ ಸಂಖ್ಯೆ ಮೂಲಕ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
        verifiedHandover: 'ದೃಢೀಕೃತ ಹಸ್ತಾಂತರ ✅',
        translateBtn: '🌐 ಅನುವಾದಿಸಿ',
        claimBtn: 'ಇದು ನನ್ನ ವಸ್ತು — ದೃಢೀಕರಿಸಿ',
        chatBtn: 'ಸುರಕ್ಷಿತ ಚಾಟ್ ತೆರೆಯಿರಿ',
        qrBtn: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸಿ'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
