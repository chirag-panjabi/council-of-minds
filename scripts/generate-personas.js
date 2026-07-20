const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuidv5(name) {
  const hash = crypto.createHash('sha1').update(name).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

const agentsDir = path.join(__dirname, '../agents');
const outPath = path.join(__dirname, '../src/lib/db/fixtures/generated-personas.json');

if (!fs.existsSync(agentsDir)) {
  console.warn(`[generate-personas] Directory not found: ${agentsDir}`);
  process.exit(0);
}

const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

const personas = files.map(file => {
  const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  if (!match) {
    console.warn(`[generate-personas] Could not parse frontmatter in ${file}`);
    return null;
  }
  
  const frontmatter = match[1];
  const instructions = match[2].trim();
  
  const meta = {};
  frontmatter.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.trim().slice(0, idx).trim();
      let value = line.trim().slice(idx + 1).trim();
      // Remove surrounding quotes if they exist
      value = value.replace(/^['"](.*)['"]$/, '$1');
      meta[key] = value;
    }
  });

  if (!meta.agent_id) {
    console.warn(`[generate-personas] Missing agent_id in ${file}`);
    return null;
  }
  
  const now = Date.now();
  
  return {
    id: uuidv5(meta.agent_id),
    name: meta.name || 'Unknown Agent',
    description: meta.description || '',
    instructions: instructions,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isArchived: false,
    ui_color: meta.ui_color,
    recommended_model: meta.recommended_model,
    is_council_member: meta.is_council_member === 'true',
    welcome_message: meta.welcome_message,
    price: meta.price ? parseFloat(meta.price) : 0,
  };
}).filter(Boolean);

// Create directory if it doesn't exist
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, JSON.stringify(personas, null, 2));
console.log(`[generate-personas] Generated ${personas.length} personas to ${outPath}`);
