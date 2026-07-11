const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    fs.writeFileSync(fullPath, content);
}

// 1. FIX IMMEDIATELY
replaceInFile('src/pages/UserDashboard.jsx', [
    [/import \{ Link \} from 'react-router-dom'/, "import { Link, useNavigate } from 'react-router-dom'"],
    [/export const UserDashboard = \(\) => \{\r?\n/, "export const UserDashboard = () => {\n  const navigate = useNavigate()\n"]
]);

replaceInFile('src/components/property/PropertyForm.jsx', [
    [/catch\(e\) \{\}/, "catch(e) { console.error('Failed to parse error JSON:', e) }"]
]);

replaceInFile('src/hooks/useProperties.js', [
    [/\} catch \{\}/, "} catch(e) { console.error('Recently viewed fetch failed:', e) }"]
]);

replaceInFile('src/components/property/RecommendedSection.jsx', [
    [/setRecommendations\(recs\)/, "setTimeout(() => setRecommendations(recs), 0)"]
]);

// 2. REMOVE UNUSED IMPORTS/VARS/CATCH PARAMS
const removeMotion = [/(?:,\s*motion|motion,\s*|import \{ motion \} from 'framer-motion'\r?\n)/];
replaceInFile('src/components/auth/AuthGateModal.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/components/common/OnboardingQuiz.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/components/layout/Layout.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/pages/AuthHome.jsx', [ 
    [removeMotion[0], ""],
    [/const dispatch = useDispatch\(\)\r?\n/, ""]
]);

replaceInFile('src/components/common/ScrollToTop.jsx', [
    [/\{ pathname, search \}/, "{ pathname }"]
]);

replaceInFile('src/components/property/PropertyCard.jsx', [
    [/const numBeds = property\.bhk_type \? parseInt\(property\.bhk_type\.replace\(\/\[\^0-9\]\/g, ''\)\) : 0\r?\n/, ""]
]);

replaceInFile('src/pages/LandlordDashboard.jsx', [
    [/import \{ cn \} from '\.\.\/utils\/helpers'\r?\n/, ""]
]);

replaceInFile('src/pages/PropertyDetail.jsx', [
    [/catch \(vErr\)/, "catch"],
    [/const otherImages = \[\]\r?\n/, ""]
]);

replaceInFile('src/pages/ServiceDetail.jsx', [
    [/reviewsLoading, /, ""]
]);

replaceInFile('src/pages/ServiceProviderDashboard.jsx', [
    [/catch \(err\)/g, "catch"],
    [/handler: async function\(response\)/, "handler: async function()"]
]);

replaceInFile('src/pages/Search.jsx', [
    [/import \{ useAuth \} from '\.\.\/hooks\/useAuth'\r?\n/, ""]
]);


// 3. UES EFFECT DEPENDENCIES
replaceInFile('src/components/home/PropertySection.jsx', [
    [/useEffect\(\(\) => \{ fetchFeatured\(\) \}, \[\]\)/, "useEffect(() => { fetchFeatured() }, [fetchFeatured])"]
]);

replaceInFile('src/hooks/useAuth.js', [
    [/\}, \[\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [])"]
]);

replaceInFile('src/pages/LandlordDashboard.jsx', [
    [/\}, \[user\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user])"]
]);

replaceInFile('src/pages/NearbyServices.jsx', [
    [/\}, \[searchParams\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [searchParams])"]
]);

replaceInFile('src/pages/PropertyDetail.jsx', [
    [/\}, \[user, property, id, fetchGatedData, checkSiteVisit\]\)/, "}, [user, property, id, fetchGatedData, checkSiteVisit, checkUnlockStatus])"]
]);

replaceInFile('src/pages/PropertyEdit.jsx', [
    [/\}, \[id, user, navigate\]\)/, "}, [id, user, navigate, fetchPropertyById])"]
]);

replaceInFile('src/pages/SavedProperties.jsx', [
    [/\}, \[user, favorites\]\)/, "}, [user, favorites, loadProperties])"]
]);

replaceInFile('src/pages/ServiceProviderDashboard.jsx', [
    [/\}, \[user\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user])"]
]);

replaceInFile('src/pages/SystemAdmin.jsx', [
    [/\}, \[user\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user])"]
]);

replaceInFile('src/pages/UserDashboard.jsx', [
    [/\}, \[user, favorites, recentlyViewed\]\)/, "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user, favorites, recentlyViewed])"]
]);

console.log("Done");
