// Match the strictest locked dependency (Vitest 5).
export const nodeRequirement = 'Node.js 22.12+（22 系列）、24.x 或 26+';
export function supportsNode(version) {
 const [major,minor]=version.split('.').map(Number);
 return major===22&&minor>=12 || major===24 || major>=26;
}
