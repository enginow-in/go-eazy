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

const removeMotion = [/(?:,\s*motion|motion,\s*|import\s*\{\s*motion\s*\}\s*from\s*'framer-motion'[\r\n]*)/];
replaceInFile('src/components/auth/AuthGateModal.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/components/common/OnboardingQuiz.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/components/layout/Layout.jsx', [ [removeMotion[0], ""] ]);
replaceInFile('src/pages/AuthHome.jsx', [ 
    [removeMotion[0], ""],
    [/const dispatch = useDispatch\(\)[\r\n]*/, ""],
    [/(?:,\s*useDispatch|useDispatch,\s*|import\s*\{\s*useDispatch\s*\}\s*from\s*'react-redux'[\r\n]*)/, ""]
]);

replaceInFile('src/components/common/ScrollToTop.jsx', [
    [/\{ pathname, search \}/, "{ pathname }"]
]);

replaceInFile('src/components/property/PropertyCard.jsx', [
    [/const numBeds = property\.bhk_type \? parseInt\([^)]+\) : 0[\r\n]*/, ""]
]);

replaceInFile('src/pages/LandlordDashboard.jsx', [
    [/import\s*\{\s*cn\s*\}\s*from\s*'\.\.\/utils\/helpers'[\r\n]*/, ""]
]);

replaceInFile('src/pages/PropertyDetail.jsx', [
    [/catch\s*\(vErr\)/, "catch"],
    [/const otherImages = \[\][\r\n]*/, ""]
]);

replaceInFile('src/pages/ServiceDetail.jsx', [
    [/reviewsLoading,\s*/, ""]
]);

replaceInFile('src/pages/ServiceProviderDashboard.jsx', [
    [/catch\s*\(err\)/g, "catch"],
    [/const\s*response\s*=\s*await\s*fetch/g, "await fetch"],
    [/handler:\s*async\s*function\s*\(response\)/, "handler: async function()"]
]);

replaceInFile('src/pages/Search.jsx', [
    [/import\s*\{\s*useAuth\s*\}\s*from\s*'\.\.\/hooks\/useAuth'[\r\n]*/, ""]
]);

console.log("Done");
