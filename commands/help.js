import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('使い方を説明します'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('title')
        .setDescription(`
text
          `)
        .setFooter({ text: 'BOT ver0.0.2' })
        .setColor('#00ff00');
      await interaction.reply({ embeds: [embed] });
  }
};

export default command;