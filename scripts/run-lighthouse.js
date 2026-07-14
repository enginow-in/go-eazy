/* global process */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

const routesToTest = [
  { name: 'home', path: '/' },
  { name: 'search', path: '/search' }
];

const reportsDir = path.join(process.cwd(), 'lighthouse-reports');

// Ensure the reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('Starting Lighthouse Audit...\n');
console.log('Ensure that the preview server is running on port 4173 (npm run build && npm run preview)\n');

const results = [];

for (const route of routesToTest) {
  const url = `${BASE_URL}${route.path}`;
  const outputPathBase = path.join(reportsDir, route.name);
  
  console.log(`Auditing ${route.name} page (${url})...`);
  
  try {
    // Run lighthouse CLI synchronously
    // We use npx to ensure it runs the locally installed version
    execSync(
      `npx lighthouse ${url} --output=html --output=json --output-path=${outputPathBase} --chrome-flags="--headless" --quiet`,
      { stdio: 'inherit' }
    );

    // Read the generated JSON file to extract scores
    const reportPath = `${outputPathBase}.report.json`;
    if (fs.existsSync(reportPath)) {
      const rawData = fs.readFileSync(reportPath, 'utf8');
      const data = JSON.parse(rawData);
      
      const scores = {
        name: route.name,
        performance: Math.round(data.categories.performance.score * 100),
        accessibility: Math.round(data.categories.accessibility.score * 100),
        bestPractices: Math.round(data.categories['best-practices'].score * 100),
        seo: Math.round(data.categories.seo.score * 100),
        audits: data.audits
      };
      
      results.push(scores);
      
      console.log(`✅ Completed audit for ${route.name}`);
      console.log(`   Performance: ${scores.performance}`);
      console.log(`   Accessibility: ${scores.accessibility}`);
      console.log(`   Best Practices: ${scores.bestPractices}`);
      console.log(`   SEO: ${scores.seo}\n`);
    }
  } catch (err) {
    console.error(`❌ Failed to run lighthouse on ${route.name}:`, err.message);
  }
}

console.log('--- SUMMARY ---');
results.forEach(res => {
  console.log(`\nResults for ${res.name.toUpperCase()} page:`);
  console.log(`Performance: ${res.performance}`);
  console.log(`Accessibility: ${res.accessibility}`);
  console.log(`Best Practices: ${res.bestPractices}`);
  console.log(`SEO: ${res.seo}`);
  
  // Find top fixes for scores below 90
  const findOpportunities = () => {
    return Object.values(res.audits)
      .filter(audit => audit.score !== null && audit.score < 1 && audit.details && audit.details.type === 'opportunity')
      .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
      .slice(0, 3)
      .map(a => a.title);
  };
  
  if (res.performance < 90 || res.accessibility < 90 || res.bestPractices < 90 || res.seo < 90) {
    console.log('\nTop Recommended Fixes:');
    const fixes = findOpportunities();
    if (fixes.length > 0) {
      fixes.forEach(fix => console.log(` - ${fix}`));
    } else {
       // Just grab failing audits if no opportunities
       const failing = Object.values(res.audits)
         .filter(audit => audit.score !== null && audit.score < 1 && audit.weight && audit.weight > 0)
         .slice(0, 3)
         .map(a => a.title);
       failing.forEach(fail => console.log(` - ${fail}`));
    }
  }
});

console.log('\nHTML Reports saved to /lighthouse-reports directory.');
