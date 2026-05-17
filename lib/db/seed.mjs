import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const USERS = [
  { username: "neon_rider", displayName: "Neon Rider", bio: "Chasing light and speed ⚡", avatarUrl: "https://picsum.photos/seed/neon/200/200" },
  { username: "soleil_arc", displayName: "Soleil Arc", bio: "Golden hour is the only hour 🌅", avatarUrl: "https://picsum.photos/seed/soleil/200/200" },
  { username: "drift.xyz", displayName: "Drift", bio: "Motion is my medium. 📸", avatarUrl: "https://picsum.photos/seed/drift/200/200" },
  { username: "voidwalker_", displayName: "Void Walker", bio: "Exploring the dark spaces between stars 🌌", avatarUrl: "https://picsum.photos/seed/void/200/200" },
  { username: "flora.frame", displayName: "Flora Frame", bio: "Plants, prints, and pretty things 🌿", avatarUrl: "https://picsum.photos/seed/flora/200/200" },
  { username: "kuro_static", displayName: "Kuro Static", bio: "Noise is just unheard music 🎧", avatarUrl: "https://picsum.photos/seed/kuro/200/200" },
  { username: "lumi.creates", displayName: "Lumi Creates", bio: "Color theory obsessed 🎨", avatarUrl: "https://picsum.photos/seed/lumi/200/200" },
  { username: "terra.shot", displayName: "Terra Shot", bio: "Streets and souls 🏙️", avatarUrl: "https://picsum.photos/seed/terra/200/200" },
  { username: "prism_pop", displayName: "Prism Pop", bio: "Refraction as art ✨", avatarUrl: "https://picsum.photos/seed/prism/200/200" },
  { username: "arcane.lens", displayName: "Arcane Lens", bio: "Every click is a spell 🔮", avatarUrl: "https://picsum.photos/seed/arcane/200/200" },
];

const POST_DATA = [
  { caption: "Golden hour never disappoints 🌅 #photography #goldenHour #sunset", seeds: ["arch", "lake", "sky1"], hashtags: ["photography", "goldenHour", "sunset"] },
  { caption: "Lost in the urban jungle 🏙️ #streetphotography #citylife", seeds: ["city1", "city2", "city3"], hashtags: ["streetphotography", "citylife"] },
  { caption: "Nature always finds a way 🌿 #nature #green #botanical", seeds: ["forest", "plant1", "moss"], hashtags: ["nature", "green", "botanical"] },
  { caption: "Minimalism is the ultimate sophistication ◼️ #minimal #design #aesthetic", seeds: ["minimal1", "minimal2"], hashtags: ["minimal", "design", "aesthetic"] },
  { caption: "Textures that make your eyes happy 🤌 #texture #abstract #art", seeds: ["texture1", "texture2", "texture3"], hashtags: ["texture", "abstract", "art"] },
  { caption: "The ocean always clears my head 🌊 #ocean #waves #peace", seeds: ["ocean1", "waves", "sea"], hashtags: ["ocean", "waves", "peace"] },
  { caption: "Architecture is frozen music 🏛️ #architecture #building #structure", seeds: ["arch1", "arch2"], hashtags: ["architecture", "building", "structure"] },
  { caption: "Chasing the perfect shot since forever 📷 #photography #travel #explore", seeds: ["travel1", "travel2", "travel3"], hashtags: ["photography", "travel", "explore"] },
  { caption: "Neon dreams and midnight scenes 🌃 #nightphotography #neon #nightlife", seeds: ["neon1", "neon2"], hashtags: ["nightphotography", "neon", "nightlife"] },
  { caption: "Every face tells a story 👤 #portrait #people #human", seeds: ["face1", "face2"], hashtags: ["portrait", "people", "human"] },
  { caption: "Coffee and creativity go hand in hand ☕ #coffee #morning #creative", seeds: ["coffee1", "cafe"], hashtags: ["coffee", "morning", "creative"] },
  { caption: "Mountains were calling, I answered 🏔️ #mountains #hiking #adventure", seeds: ["mtn1", "mtn2", "peak"], hashtags: ["mountains", "hiking", "adventure"] },
  { caption: "Rain on glass is its own kind of art 🌧️ #rain #glass #abstract", seeds: ["rain1", "rain2"], hashtags: ["rain", "glass", "abstract"] },
  { caption: "Street art deserves its own gallery 🖼️ #streetart #graffiti #urban", seeds: ["art1", "graffiti", "mural"], hashtags: ["streetart", "graffiti", "urban"] },
  { caption: "The quiet before sunrise hits different 🌄 #sunrise #morning #quiet", seeds: ["sunrise1", "dawn"], hashtags: ["sunrise", "morning", "quiet"] },
  { caption: "Details matter. Always. 🔍 #detail #macro #closeup", seeds: ["macro1", "macro2"], hashtags: ["detail", "macro", "closeup"] },
  { caption: "Symmetry is the language of the universe 🔲 #symmetry #geometry #pattern", seeds: ["sym1", "sym2"], hashtags: ["symmetry", "geometry", "pattern"] },
  { caption: "Desert heat and endless horizon 🏜️ #desert #landscape #vast", seeds: ["desert1", "desert2"], hashtags: ["desert", "landscape", "vast"] },
  { caption: "Candid moments are the most honest 😌 #candid #street #reallife", seeds: ["candid1", "candid2"], hashtags: ["candid", "street", "reallife"] },
  { caption: "Light is the only brush I need 🖌️ #light #shadow #photography", seeds: ["light1", "shadow", "light2"], hashtags: ["light", "shadow", "photography"] },
];

function pickRandom(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, Math.min(n, arr.length));
}

function pickRandomArr(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing seed data (keep real user accounts)
    console.log("Clearing existing seed data...");
    await client.query(`DELETE FROM story_views`);
    await client.query(`DELETE FROM stories WHERE author_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM notifications WHERE recipient_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%') OR actor_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM likes WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM saves WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM comments WHERE author_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM follows WHERE follower_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%') OR following_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM posts WHERE author_id IN (SELECT id FROM users WHERE clerk_id LIKE 'seed_%')`);
    await client.query(`DELETE FROM users WHERE clerk_id LIKE 'seed_%'`);

    // Insert seed users
    console.log("Inserting seed users...");
    const userIds = [];
    for (const u of USERS) {
      const { rows } = await client.query(
        `INSERT INTO users (clerk_id, username, display_name, bio, avatar_url, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [`seed_${u.username}`, u.username, u.displayName, u.bio, u.avatarUrl, Math.random() > 0.7]
      );
      userIds.push(rows[0].id);
    }

    // Insert follows (each user follows 4-7 others)
    console.log("Inserting follows...");
    for (let i = 0; i < userIds.length; i++) {
      const targets = pickRandom(userIds.filter((_, j) => j !== i), Math.floor(Math.random() * 4) + 4);
      for (const targetId of targets) {
        await client.query(
          `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userIds[i], targetId]
        );
      }
    }

    // Insert posts
    console.log("Inserting posts...");
    const postIds = [];
    for (let p = 0; p < POST_DATA.length; p++) {
      const post = POST_DATA[p];
      const authorId = userIds[p % userIds.length];
      const seed = post.seeds[0];
      const mediaUrl = `https://picsum.photos/seed/${seed}/800/800`;

      const hoursAgo = Math.floor(Math.random() * 72);
      const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

      const { rows } = await client.query(
        `INSERT INTO posts (author_id, caption, media_url, media_type, hashtags, views_count, created_at, updated_at)
         VALUES ($1, $2, $3, 'image', $4, $5, $6, $6)
         RETURNING id`,
        [authorId, post.caption, mediaUrl, post.hashtags, Math.floor(Math.random() * 2000) + 50, createdAt]
      );
      postIds.push(rows[0].id);
    }

    // Insert likes (random users like random posts)
    console.log("Inserting likes...");
    for (const postId of postIds) {
      const likers = pickRandom(userIds, Math.floor(Math.random() * 6) + 2);
      for (const userId of likers) {
        await client.query(
          `INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, postId]
        );
      }
    }

    // Insert comments
    console.log("Inserting comments...");
    const COMMENTS = [
      "This is absolutely stunning 😍",
      "Love this so much! 🔥",
      "The lighting here is perfect ✨",
      "Major inspo right here 🙌",
      "Can't stop staring at this",
      "Vibes are immaculate 💫",
      "This deserves way more attention",
      "How do you do it every time?! 🤩",
      "Saved this immediately 📌",
      "This hits different at night 🌙",
      "Incredible composition 👌",
      "The colors!! 😭",
      "Okay this one's a top 5 for sure",
      "I feel this in my soul 🖤",
    ];
    for (const postId of postIds) {
      const commenters = pickRandomArr(userIds, Math.floor(Math.random() * 3) + 1);
      for (const userId of commenters) {
        await client.query(
          `INSERT INTO comments (post_id, author_id, content) VALUES ($1, $2, $3)`,
          [postId, userId, pickRandom(COMMENTS)]
        );
      }
    }

    // Insert stories (3 users have active stories)
    console.log("Inserting stories...");
    const storyUsers = pickRandom(userIds, 4);
    const storySeeds = ["story1", "story2", "story3", "story4"];
    for (let i = 0; i < storyUsers.length; i++) {
      const expiresAt = new Date(Date.now() + 20 * 3600 * 1000).toISOString();
      await client.query(
        `INSERT INTO stories (author_id, media_url, media_type, expires_at)
         VALUES ($1, $2, 'image', $3)`,
        [storyUsers[i], `https://picsum.photos/seed/${storySeeds[i]}/400/700`, expiresAt]
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Seed complete: ${USERS.length} users, ${POST_DATA.length} posts, stories, likes, follows, comments`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
