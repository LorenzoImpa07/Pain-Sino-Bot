const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField, REST, Routes } = require('discord.js');
require('dotenv').config();

// Inizializzazione Client Discord con gli Intent necessari (incluso GuildMembers)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Variabili di configurazione lette dall'ambiente di Railway
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID;
const UNVERIFIED_ROLE_ID = '1518197202596663437'; // Ruolo non verificato specificato
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

// Controllo di sicurezza per il token su Railway
if (!TOKEN) {
  console.error('❌ ERRORE: Il token non è presente nelle variabili d\'ambiente di Railway!');
  process.exit(1);
}

client.once('ready', async () => {
  console.log(`[BOT ONLINE] Acceduto come: ${client.user.tag}`);

  // Registrazione dei Comandi Slash
  const commands = [
    {
      name: 'setup-verifica',
      description: 'Invia il pannello di verifica nel canale corrente',
      defaultMemberPermissions: PermissionsBitField.Flags.Administrator.toString(),
    },
    {
      name: 'setup-ticket',
      description: 'Invia il pannello avanzato dei ticket con menu a tendina',
      defaultMemberPermissions: PermissionsBitField.Flags.Administrator.toString(),
    },
    {
      name: 'ban',
      description: 'Banna un utente dal server',
      options: [
        { name: 'utente', type: 6, description: 'Utente da bannare', required: true },
        { name: 'motivo', type: 3, description: 'Motivo del ban', required: false }
      ]
    },
    {
      name: 'kick',
      description: 'Espelli un utente dal server',
      options: [
        { name: 'utente', type: 6, description: 'Utente da espellere', required: true },
        { name: 'motivo', type: 3, description: 'Motivo dell espulsione', required: false }
      ]
    },
    {
      name: 'timeout',
      description: 'Metti in timeout un utente',
      options: [
        { name: 'utente', type: 6, description: 'Utente da mettere in timeout', required: true },
        { name: 'minuti', type: 4, description: 'Durata in minuti', required: true },
        { name: 'motivo', type: 3, description: 'Motivo del timeout', required: false }
      ]
    },
    {
      name: 'clear',
      description: 'Cancella un numero specifico di messaggi',
      options: [
        { name: 'quantita', type: 4, description: 'Numero di messaggi da eliminare (1-100)', required: true }
      ]
    },
    {
      name: 'annuncio',
      description: 'Invia un annuncio formattato stile live/video a nome di Pain & Sino',
      options: [
        { name: 'titolo', type: 3, description: 'Titolo o stato della live/video', required: true },
        { name: 'messaggio', type: 3, description: 'Descrizione o link della live/video', required: true },
        { name: 'media', type: 11, description: 'Carica un immagine o un video da mostrare nell embed', required: false },
        { name: 'canale', type: 7, description: 'Canale in cui inviare l annuncio', required: false }
      ]
    }
  ];

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('[RAILWAY/DEPLOY] Comandi registrati con successo!');
  } catch (error) {
    console.error('Errore nella registrazione dei comandi:', error);
  }
});

// Evento: Assegnazione ruolo non verificato e benvenuto nuovi membri
client.on('guildMemberAdd', async (member) => {
  try {
    const unverifiedRole = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
    if (unverifiedRole) {
      await member.roles.add(unverifiedRole);
    }
  } catch (error) {
    console.error('Errore nell assegnazione del ruolo non verificato:', error);
  }

  if (!WELCOME_CHANNEL_ID) return;
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const welcomeEmbed = new EmbedBuilder()
    .setColor('#9b59b6')
    .setTitle('Benvenuto su Pain & Sino!')
    .setDescription(`Ciao ${member}, benvenuto nel nostro server! Ricordati di verificare il tuo account per accedere a tutti i canali.`)
    .setTimestamp();

  channel.send({ embeds: [welcomeEmbed] });
});

// Gestione Interazioni (Comandi Slash e Componenti)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    if (commandName === 'setup-verifica') {
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('Verifica - Pain & Sino')
        .setDescription('Clicca sul bottone sottostante per verificare il tuo account e sbloccare l accesso al server.');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_btn')
          .setLabel('Verificati')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

      await interaction.reply({ content: 'Pannello di verifica inviato con successo!', ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }

    if (commandName === 'setup-ticket') {
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle('🎫 Sistema di Supporto - Pain & Sino')
        .setDescription('Seleziona dal menu a tendina sottostante la categoria di ticket che desideri aprire.');

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_main_select')
        .setPlaceholder('Seleziona una categoria...')
        .addOptions([
          {
            label: 'Assistenza Generale',
            description: 'Per richieste generiche o dubbi',
            value: 'ticket_general',
            emoji: '🛠️',
          },
          {
            label: 'Segnalazioni',
            description: 'Segnala utenti, violazioni o bug',
            value: 'ticket_report',
            emoji: '⚔️',
          },
          {
            label: 'Candidatura Staff',
            description: 'Apri il menu per candidarti nei vari ruoli',
            value: 'ticket_staff_menu',
            emoji: '📝',
          },
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({ content: 'Pannello ticket inviato con successo!', ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }

    if (commandName === 'ban') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per usare questo comando.', ephemeral: true });
      }
      const user = options.getUser('utente');
      const reason = options.getString('motivo') || 'Nessun motivo specificato';
      const member = await interaction.guild.members.fetch(user.id);
      
      await member.ban({ reason });
      await interaction.reply({ content: `Utente ${user.tag} bannato con successo. Motivo: ${reason}`, ephemeral: true });
    }

    if (commandName === 'kick') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per usare questo comando.', ephemeral: true });
      }
      const user = options.getUser('utente');
      const reason = options.getString('motivo') || 'Nessun motivo specificato';
      const member = await interaction.guild.members.fetch(user.id);

      await member.kick(reason);
      await interaction.reply({ content: `Utente ${user.tag} espulso con successo. Motivo: ${reason}`, ephemeral: true });
    }

    if (commandName === 'timeout') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per usare questo comando.', ephemeral: true });
      }
      const user = options.getUser('utente');
      const minutes = options.getInteger('minuti');
      const reason = options.getString('motivo') || 'Nessun motivo specificato';
      const member = await interaction.guild.members.fetch(user.id);

      await member.timeout(minutes * 60 * 1000, reason);
      await interaction.reply({ content: `Utente ${user.tag} messo in timeout per ${minutes} minuti. Motivo: ${reason}`, ephemeral: true });
    }

    if (commandName === 'clear') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({ content: 'Non hai i permessi per usare questo comando.', ephemeral: true });
      }
      const amount = options.getInteger('quantita');
      if (amount < 1 || amount > 100) {
        return interaction.reply({ content: 'Puoi cancellare un numero di messaggi compreso tra 1 e 100.', ephemeral: true });
      }

      await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Eliminati con successo ${amount} messaggi.`, ephemeral: true });
    }

    if (commandName === 'annuncio') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Non hai i permessi per usare questo comando.', ephemeral: true });
      }
      const title = options.getString('titolo');
      const message = options.getString('messaggio');
      const mediaAttachment = options.getAttachment('media');
      const channel = options.getChannel('canale') || interaction.channel;

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`🔴 ${title}`)
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: `Pain & Sino` });

      if (mediaAttachment) {
        // Se il file allegato è un video o un'immagine, lo impostiamo come immagine/video nell'embed
        embed.setImage(mediaAttachment.url);
      }

      await channel.send({
        content: `@everyone @here`,
        embeds: [embed]
      });

      await interaction.reply({ content: `Annuncio in stile live inviato con successo in ${channel}!`, ephemeral: true });
    }
  }

  // Gestione Bottoni
  if (interaction.isButton()) {
    if (interaction.customId === 'verify_btn') {
      if (!VERIFIED_ROLE_ID) {
        return interaction.reply({ content: 'Errore di configurazione: Ruolo verificato non impostato.', ephemeral: true });
      }
      const verifiedRole = interaction.guild.roles.cache.get(VERIFIED_ROLE_ID);
      const unverifiedRole = interaction.guild.roles.cache.get(UNVERIFIED_ROLE_ID);

      if (!verifiedRole) {
        return interaction.reply({ content: 'Errore: Impossibile trovare il ruolo di verifica.', ephemeral: true });
      }

      if (interaction.member.roles.cache.has(VERIFIED_ROLE_ID)) {
        return interaction.reply({ content: 'Sei già verificato!', ephemeral: true });
      }

      try {
        await interaction.member.roles.add(verifiedRole);
        if (unverifiedRole && interaction.member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
          await interaction.member.roles.remove(unverifiedRole);
        }
        await interaction.reply({ content: 'Sei stato verificato con successo!', ephemeral: true });
      } catch (error) {
        console.error('Errore durante il processo di verifica:', error);
        await interaction.reply({ content: 'Si è verificato un errore durante la verifica.', ephemeral: true });
      }
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: 'Chiusura del ticket in corso...' });
      setTimeout(async () => {
        await interaction.channel.delete().catch(() => {});
      }, 3000);
    }
  }

  // Gestione Menu a Tendina (Select Menus)
  if (interaction.isStringSelectMenu()) {
    const guild = interaction.guild;

    if (interaction.customId === 'ticket_main_select') {
      const selectedValue = interaction.values[0];

      if (selectedValue === 'ticket_staff_menu') {
        const staffSelectMenu = new StringSelectMenuBuilder()
          .setCustomId('ticket_staff_role_select')
          .setPlaceholder('Seleziona il ruolo per cui candidarti...')
          .addOptions([
            { label: 'Helper', description: 'Candidati per il ruolo di Helper', value: 'candidatura_helper', emoji: '💡' },
            { label: 'Mod', description: 'Candidati per il ruolo di Mod', value: 'candidatura_mod', emoji: '🛡️' },
            { label: 'Admin', description: 'Candidati per il ruolo di Admin', value: 'candidatura_admin', emoji: '⚡' },
            { label: 'Media', description: 'Candidati per il ruolo di Media', value: 'candidatura_media', emoji: '📸' },
            { label: 'Streamer', description: 'Candidati per il ruolo di Streamer', value: 'candidatura_streamer', emoji: '🎥' },
            { label: 'Youtuber', description: 'Candidati per il ruolo di Youtuber', value: 'candidatura_youtuber', emoji: '▶️' },
          ]);

        const staffRow = new ActionRowBuilder().addComponents(staffSelectMenu);
        return interaction.reply({ content: '📋 **Menu Candidature Staff:** Scegli il ruolo di tuo interesse:', components: [staffRow], ephemeral: true });
      }

      let ticketType = '';
      let ticketPrefix = '';
      if (selectedValue === 'ticket_general') {
        ticketType = 'Assistenza Generale';
        ticketPrefix = 'assistenza';
      } else if (selectedValue === 'ticket_report') {
        ticketType = 'Segnalazioni';
        ticketPrefix = 'segnalazione';
      }

      const channelName = `${ticketPrefix}-${interaction.user.username}`.toLowerCase();
      const existingChannel = guild.channels.cache.find(c => c.name === channelName);
      if (existingChannel) {
        return interaction.reply({ content: `Hai già un ticket aperto: ${existingChannel}`, ephemeral: true });
      }

      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ];
      if (STAFF_ROLE_ID) {
        permissionOverwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID || null,
        permissionOverwrites: permissionOverwrites,
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Ticket: ${ticketType} - Pain & Sino`)
        .setDescription(`Benvenuto ${interaction.user}. Descrivi dettagliatamente la tua richiesta. Lo staff ti risponderà il prima possibile.`);

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Chiudi Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await ticketChannel.send({ embeds: [ticketEmbed], components: [closeRow] });
      await interaction.reply({ content: `Ticket creato con successo: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.customId === 'ticket_staff_role_select') {
      const selectedRoleValue = interaction.values[0];
      let roleName = '';
      if (selectedRoleValue === 'candidatura_helper') roleName = 'Helper';
      if (selectedRoleValue === 'candidatura_mod') roleName = 'Mod';
      if (selectedRoleValue === 'candidatura_admin') roleName = 'Admin';
      if (selectedRoleValue === 'candidatura_media') roleName = 'Media';
      if (selectedRoleValue === 'candidatura_streamer') roleName = 'Streamer';
      if (selectedRoleValue === 'candidatura_youtuber') roleName = 'Youtuber';

      const channelName = `candidatura-${roleName}-${interaction.user.username}`.toLowerCase();
      const existingChannel = guild.channels.cache.find(c => c.name === channelName);
      if (existingChannel) {
        return interaction.reply({ content: `Hai già una candidatura aperta: ${existingChannel}`, ephemeral: true });
      }

      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      ];
      if (STAFF_ROLE_ID) {
        permissionOverwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID || null,
        permissionOverwrites: permissionOverwrites,
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle(`Candidatura Staff: ${roleName} - Pain & Sino`)
        .setDescription(`Benvenuto ${interaction.user} nella tua candidatura per **${roleName}**.\n\nRispondi alle seguenti domande per inviare la tua richiesta:\n1. Quanti anni hai?\n2. Perché vuoi candidarti per questo ruolo?\n3. Hai esperienze precedenti?`);

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Chiudi Candidatura')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await ticketChannel.send({ embeds: [ticketEmbed], components: [closeRow] });
      await interaction.reply({ content: `Canale di candidatura creato con successo: ${ticketChannel}`, ephemeral: true });
    }
  }
});

client.login(TOKEN);
