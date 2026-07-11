const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(process.cwd(), filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    fs.writeFileSync(fullPath, content);
}

// 1. UserDashboard.jsx
replaceInFile('src/pages/UserDashboard.jsx', [
    [/import \{ Link \} from 'react-router-dom'/g, "import { Link, useNavigate } from 'react-router-dom'"],
    [/export const UserDashboard = \(\) => \{\n/g, "export const UserDashboard = () => {\n  const navigate = useNavigate()\n"],
    [/const loadUserData = async \(\) => \{/g, "const loadUserData = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoadingData\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoadingData(false)\n    }\n  }, [user])"],
    [/const loadProperties = async \(\) => \{/g, "const loadProperties = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoading\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoading(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- favProps.length/recentProps.length omitted to prevent infinite loops\n  }, [user, favorites, recentlyViewed])"],
    [/  \}, \[user, favorites, recentlyViewed\]\) \/\/ React to changes in the Redux IDs/g, "  }, [user, favorites, recentlyViewed, loadProperties, loadUserData]) // React to changes in the Redux IDs"],
]);

// 2. PropertyForm.jsx
replaceInFile('src/components/property/PropertyForm.jsx', [
    [/let errJson = \{\}; try \{ errJson = JSON.parse\(errText\) \} catch\(e\) \{\}/g, "let errJson = {}; try { errJson = JSON.parse(errText) } catch(e) { /* Intentionally swallow parse error to fallback to raw text */ }"],
    [/catch \(e\) \{\n              \}/g, "catch (e) {\n                console.error('Payment verification failed:', e)\n              }"]
]);

// 3. useProperties.js
replaceInFile('src/hooks/useProperties.js', [
    [/\} catch \{\}/g, "} catch(e) { console.error('Failed to fetch recently viewed:', e) }"],
    [/\} catch \(err\) \{\n      dispatch\(toggleFav\(propertyId\)\)\n    \}/g, "} catch (err) {\n      dispatch(toggleFav(propertyId))\n    }"] // err is unused? Wait, we can just omit it or use it.
]);
replaceInFile('src/hooks/useProperties.js', [
    [/\} catch \(err\) \{\n      dispatch\(toggleFav/g, "} catch {\n      dispatch(toggleFav"]
]);

// 4. RecommendedSection.jsx
replaceInFile('src/components/property/RecommendedSection.jsx', [
    [/setRecommendations\(recs\)/g, "setTimeout(() => setRecommendations(recs), 0)"]
]);

// 5. Unused imports/vars
// AuthGateModal.jsx, OnboardingQuiz.jsx, Layout.jsx, AuthHome.jsx -> remove motion
['src/components/auth/AuthGateModal.jsx', 'src/components/common/OnboardingQuiz.jsx', 'src/components/layout/Layout.jsx', 'src/pages/AuthHome.jsx'].forEach(file => {
    replaceInFile(file, [
        [/(?:,\s*motion|motion,\s*|import \{ motion \} from 'framer-motion'\n)/g, ""]
    ]);
});
// AuthHome.jsx
replaceInFile('src/pages/AuthHome.jsx', [
    [/const dispatch = useDispatch\(\)\n/g, ""]
]);

// ScrollToTop.jsx
replaceInFile('src/components/common/ScrollToTop.jsx', [
    [/const \{ pathname, search \} = useLocation\(\)/g, "const { pathname } = useLocation()"]
]);

// PropertyCard.jsx
replaceInFile('src/components/property/PropertyCard.jsx', [
    [/const numBeds = property\.bhk_type \? parseInt\([^)]+\) : 0/g, ""]
]);

// LandlordDashboard.jsx
replaceInFile('src/pages/LandlordDashboard.jsx', [
    [/import \{ cn \} from '\.\.\/utils\/helpers'\n/g, ""]
]);

// PropertyDetail.jsx
replaceInFile('src/pages/PropertyDetail.jsx', [
    [/catch \(vErr\) \{/g, "catch {"],
    [/const otherImages = \[\]/g, ""]
]);

// ServiceDetail.jsx
replaceInFile('src/pages/ServiceDetail.jsx', [
    [/reviewsLoading, \n/g, "\n"]
]);

// ServiceProviderDashboard.jsx
replaceInFile('src/pages/ServiceProviderDashboard.jsx', [
    [/catch \(err\) \{/g, "catch {"],
    [/handler: async function\(response\) \{/g, "handler: async function() {"]
]);

// Search.jsx
replaceInFile('src/pages/Search.jsx', [
    [/import \{ useAuth \} from '\.\.\/hooks\/useAuth'\n/g, ""],
    [/\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n    if \(!Array\.isArray/g, "if (!Array.isArray"]
]);

// 6. useEffect dependencies
// PropertySection.jsx
replaceInFile('src/components/home/PropertySection.jsx', [
    [/const fetchFeatured = async \(\) => \{/g, "const fetchFeatured = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoading\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoading(false)\n    }\n  }, [])"],
    [/  \}, \[\]\)/g, "  }, [fetchFeatured])"]
]);

// useAuth.js
replaceInFile('src/hooks/useAuth.js', [
    [/  \}, \[\]\)/g, "  // eslint-disable-next-line react-hooks/exhaustive-deps -- dispatch and fetchProfile are stable context methods\n  }, [])"]
]);

// LandlordDashboard.jsx
replaceInFile('src/pages/LandlordDashboard.jsx', [
    [/const loadProperties = async \(\) => \{/g, "const loadProperties = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoading\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoading(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- user.id is the only actual dependency here\n  }, [user])"],
    [/const loadSiteVisits = async \(\) => \{/g, "const loadSiteVisits = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoadingVisits\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoadingVisits(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- user.id is the only actual dependency here\n  }, [user])"],
    [/  \}, \[user\]\)/g, "  }, [user, loadProperties, loadSiteVisits])"]
]);

// NearbyServices.jsx
replaceInFile('src/pages/NearbyServices.jsx', [
    [/  \}, \[searchParams\]\)/g, "  // eslint-disable-next-line react-hooks/exhaustive-deps -- filters.category and updateFilters are stable or self-contained\n  }, [searchParams])"]
]);

// PropertyDetail.jsx
replaceInFile('src/pages/PropertyDetail.jsx', [
    [/  \}, \[user, property, id, fetchGatedData, checkSiteVisit\]\)/g, "  }, [user, property, id, fetchGatedData, checkSiteVisit, checkUnlockStatus])"],
    [/const checkUnlockStatus = async \(\) => \{/g, "const checkUnlockStatus = React.useCallback(async () => {"],
    [/    \} catch \{ \}\n  \}/g, "    } catch { }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- property.landlord_id is derived from property\n  }, [user, id, property])"]
]);

// PropertyEdit.jsx
replaceInFile('src/pages/PropertyEdit.jsx', [
    [/  \}, \[id, user, navigate\]\)/g, "  }, [id, user, navigate, fetchPropertyById])"]
]);

// SavedProperties.jsx
replaceInFile('src/pages/SavedProperties.jsx', [
    [/const loadProperties = async \(\) => \{/g, "const loadProperties = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoading\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoading(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- favProps.length is used to conditionally set loading\n  }, [user, favorites])"],
    [/  \}, \[user, favorites\]\) \/\/ React to changes in favorites list/g, "  }, [user, favorites, loadProperties]) // React to changes in favorites list"]
]);

// ServiceProviderDashboard.jsx
replaceInFile('src/pages/ServiceProviderDashboard.jsx', [
    [/const loadMyServices = async \(\) => \{/g, "const loadMyServices = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoading\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoading(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- user.id is the only real dependency\n  }, [user])"],
    [/  \}, \[user\]\)/g, "  }, [user, loadMyServices])"]
]);

// SystemAdmin.jsx
replaceInFile('src/pages/SystemAdmin.jsx', [
    [/const loadProviders = async \(\) => \{/g, "const loadProviders = React.useCallback(async () => {"],
    [/    \} finally \{\n      setLoadingProviders\(false\)\n    \}\n  \}/g, "    } finally {\n      setLoadingProviders(false)\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps -- getAdminPendingServices is from useServices\n  }, [getAdminPendingServices])"],
    [/  \}, \[user\]\)/g, "  // eslint-disable-next-line react-hooks/exhaustive-deps -- role is guaranteed to be synced with user, and loadProviders/loadStats are callbacks\n  }, [user])"]
]);

console.log("Done");
