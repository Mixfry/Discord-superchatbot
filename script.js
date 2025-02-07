import { command as help } from './commands/help.js';
import { command as superchat } from './commands/superchat.js';
import { command as link } from './commands/link.js';
import { command as profile } from './commands/profile.js';

import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
  console.log(`${c.user.tag}が飛び乗った！`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  try {
    switch (interaction.commandName) {
      case help.data.name:
        await help.execute(interaction);
        break;
      case superchat.data.name:
        await superchat.execute(interaction);
        break;
      case link.data.name:
        await link.execute(interaction);
        break;
      case profile.data.name:
        await profile.execute(interaction);
        break;
      default:
        console.error(`${interaction.commandName}というコマンドには対応していません。`);
    }
  } catch (error) {
    console.error('コマンド実行中にエラーが発生しました:', error);
  }
});

client.login(process.env.TOKEN);