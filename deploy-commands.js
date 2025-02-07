import { REST, Routes } from 'discord.js';
import help from './commands/help.js'; 
import superchat from './commands/superchat.js';
import link from './commands/link.js';
import profile from './commands/profile.js';

const commands = [
  help.data.toJSON(),
  superchat.data.toJSON(),
  link.data.toJSON(),
  profile.data.toJSON()
];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.APPLICATION_ID),
            { body: commands },
        );
        console.log('デプロイ成功！ ver1.0.2');
  } catch (error) {
    console.error('デプロイ中にエラーが発生しました:', error);
  }
})();