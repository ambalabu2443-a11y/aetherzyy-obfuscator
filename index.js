require("dotenv").config();

const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("AETHERZYY Obfuscator Bot is online.");
}).listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  AttachmentBuilder
} = require("discord.js");

const {
  obfuscate,
  isLuaFile,
  MAX_BYTES
} = require("./obfuscator");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("obfuscate")
  .setDescription("Obfuscate a Lua/Luau file.")
  .addAttachmentOption(option =>
    option
      .setName("file")
      .setDescription("Upload a .lua or .luau file")
      .setRequired(true)
  );

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const body = [command.toJSON()];

  if (GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body }
    );
    console.log("Slash command registered for guild:", GUILD_ID);
  } else {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body }
    );
    console.log("Global slash command registered.");
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "obfuscate") return;

  await interaction.deferReply({ ephemeral: true });

  const attachment = interaction.options.getAttachment("file", true);

  if (!isLuaFile(attachment.name)) {
    return interaction.editReply(
      "File harus berekstensi `.lua` atau `.luau`."
    );
  }

  if (attachment.size > MAX_BYTES) {
    return interaction.editReply(
      `File terlalu besar. Maksimum ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`
    );
  }

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const source = await response.text();

    if (!source.trim()) {
      return interaction.editReply("File kosong.");
    }

    const output = obfuscate(source);

    const ext = attachment.name.toLowerCase().endsWith(".luau")
      ? ".luau"
      : ".lua";

    const outputName =
      attachment.name.replace(/\.(lua|luau)$/i, "") + "_obfuscated" + ext;

    const buffer = Buffer.from(output, "utf8");
    const result = new AttachmentBuilder(buffer, { name: outputName });

    await interaction.editReply({
      content: "Obfuscation selesai. Source diproses di memori dan tidak disimpan oleh bot.",
      files: [result]
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "Gagal memproses file. Cek console bot untuk detail error."
    );
  }
});

(async () => {
  await registerCommands();
  await client.login(TOKEN);
})();
