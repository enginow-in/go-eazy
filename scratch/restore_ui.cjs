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

// 1. PropertyDetail.jsx
replaceInFile('src/pages/PropertyDetail.jsx', [
    [/import \{ Skeleton \} from '\.\.\/components\/ui\/Skeleton'/g, "import { Skeleton, SharedDetailSkeleton } from '../components/ui/Skeleton'"],
    [/  if \(loading\) return \(\n    <div className="pt-8 pb-20 bg-main min-h-screen">[\s\S]*?<\/div>\n  \)/g, "  if (loading) return <SharedDetailSkeleton />"]
]);

// 2. ServiceDetail.jsx
replaceInFile('src/pages/ServiceDetail.jsx', [
    [/import \{ Skeleton \} from '\.\.\/components\/ui\/Skeleton'/g, "import { Skeleton, SharedDetailSkeleton } from '../components/ui/Skeleton'"],
    [/  if \(loading\) return \(\n    <div className="pt-8 pb-20 bg-main min-h-screen">[\s\S]*?<\/div>\n  \)/g, "  if (loading) return <SharedDetailSkeleton />"]
]);

// 3. SystemAdmin.jsx
replaceInFile('src/pages/SystemAdmin.jsx', [
    [/import \{ Button \} from '\.\.\/components\/ui\/Button'/g, "import { Button } from '../components/ui/Button'\nimport { Skeleton } from '../components/ui/Skeleton'"],
    [/<div className="h-6 md:h-10 w-12 md:w-24 bg-gray-100 rounded animate-pulse" \/>/g, "<Skeleton variant=\"stat-block\" className=\"h-6 md:h-10 w-12 md:w-24\" />"]
]);

// 4. SavedProperties.jsx
replaceInFile('src/pages/SavedProperties.jsx', [
    [/<Skeleton className="w-32 h-32 sm:w-44 sm:h-44 rounded-xl flex-shrink-0" \/>/g, "<Skeleton variant=\"card\" className=\"w-32 h-32 sm:w-44 sm:h-44 rounded-xl flex-shrink-0\" />"],
    [/<Skeleton className="h-4 w-1\/4" \/>/g, "<Skeleton variant=\"text\" className=\"h-4 w-1/4\" />"],
    [/<Skeleton className="h-6 w-3\/4" \/>/g, "<Skeleton variant=\"text\" className=\"h-6 w-3/4\" />"],
    [/<Skeleton className="h-4 w-1\/2" \/>/g, "<Skeleton variant=\"text\" className=\"h-4 w-1/2\" />"],
    [/<Skeleton className="h-8 w-24" \/>/g, "<Skeleton variant=\"text\" className=\"h-8 w-24\" />"],
    [/<Skeleton className="h-8 w-16" \/>/g, "<Skeleton variant=\"text\" className=\"h-8 w-16\" />"]
]);

// 5. UserDashboard.jsx
replaceInFile('src/pages/UserDashboard.jsx', [
    [/<Skeleton className="h-44 w-full rounded-xl" \/>/g, "<Skeleton variant=\"card\" className=\"h-44 w-full rounded-xl\" />"],
    [/<Skeleton className="h-5 w-4\/5" \/>/g, "<Skeleton variant=\"text\" className=\"h-5 w-4/5\" />"],
    [/<Skeleton className="h-4 w-3\/5" \/>/g, "<Skeleton variant=\"text\" className=\"h-4 w-3/5\" />"],
    [/<Skeleton className="h-3 w-1\/4 rounded-full" \/>/g, "<Skeleton variant=\"text\" className=\"h-3 w-1/4 rounded-full\" />"],
    [/  const LoadingRow = \(\) => \([\s\S]*?\n  \)\n/g, `  const LoadingRow = () => (
    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-shrink-0 w-64 rounded-xl bg-white border border-gray-100 p-3 space-y-3">
          <Skeleton variant="card" className="h-44 w-full rounded-xl" />
          <div className="space-y-2 px-1">
            <Skeleton variant="text" className="h-5 w-4/5" />
            <Skeleton variant="text" className="h-4 w-3/5" />
            <div className="pt-1 flex gap-2">
              <Skeleton variant="text" className="h-3 w-1/4 rounded-full" />
              <Skeleton variant="text" className="h-3 w-1/4 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const LoadingVisits = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="pr-2 space-y-2 flex-1">
              <Skeleton variant="text" className="h-5 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
            </div>
            <Skeleton variant="stat-block" className="h-6 w-16 shrink-0" />
          </div>
          <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
            <Skeleton variant="text" className="h-6 w-1/2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
`],
    [/\{loadingData \? \(\n             <LoadingRow \/>\n          \) : myVisits/g, "{loadingData ? (\n             <LoadingVisits />\n          ) : myVisits"]
]);

console.log('Restored Skeletons');
