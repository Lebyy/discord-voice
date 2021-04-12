module.exports = {
  execute: async(client, member, oldDeafType, Voice, VoiceConfig, event) => {
    let config;
    config = await VoiceConfig.findOne({
      guildID: member.guild.id
    });
    if (!config) {
      config = {
        guildID: member.guild.id,
        trackbots: false,
        trackallchannels: true,
        userlimit: 0,
        channelID: [],
        trackMute: true,
        trackDeaf: true,
        isEnabled: true,
				lastUpdated: new Date()
      }
      await VoiceConfig.create(config).catch(e => console.log(`Failed to save config: ${e}`));
    }
    if (!config.trackDeaf) {
      let user = await Voice.findOne({
        userID: member.user.id,
        guildID: member.guild.id
      });
      if (!config.trackallchannels) {
        if (config.channelID.includes(member.voice.channel.id)) {
          if (!user) {
          user = {
          userID: member.user.id,
          guildID: member.guild.id,
          joinTime: {},
				  voiceTime: {},
          isBlacklisted: false,
				  lastUpdated: new Date()
          }
				  user.joinTime[channel.id] = Date.now();
				  let data = {}
				  data.user = user
				  data.config = config
				  event.emit('userVoiceUnDeaf', data, member, member.voice.channel, oldDeafType, true)
					return await Voice.create(user).catch(e => console.log(`Failed to save user voice time: ${e}`));
          }
          if (user.isBlacklisted) return;
          let jointime = user.joinTime[channel.id]
					if(!jointime) jointime = 0
					if(jointime != 0) return require('./voiceChannelLeave.js').execute(client, member, channel, Voice, VoiceConfig);
      		jointime = Date.now();
					user.joinTime[channel.id] = jointime
					user.markModified('joinTime')
          await user.save().catch(e => console.log(`Failed to save user join time: ${e}`));
          let data = {}
					data.user = user
					data.config = config
					event.emit('userVoiceUnDeaf', data, member, member.voice.channel, oldDeafType, false)
					return user;
        }
      }
      if (config.trackallchannels) {
        if (!user) {
          user = {
          userID: member.user.id,
          guildID: member.guild.id,
          joinTime: {},
				  voiceTime: {},
          isBlacklisted: false,
				  lastUpdated: new Date()
          }
				  user.joinTime[channel.id] = Date.now();
				  let data = {}
				  data.user = user
				  data.config = config
				  event.emit('userVoiceUnDeaf', data, member, member.voice.channel, oldDeafType, true)
					return await Voice.create(user).catch(e => console.log(`Failed to save user voice time: ${e}`));
          }
          let jointime = user.joinTime[channel.id]
					if(!jointime) jointime = 0
					if(jointime != 0) return require('./voiceChannelLeave.js').execute(client, member, channel, Voice, VoiceConfig);
      		jointime = Date.now();
					user.joinTime[channel.id] = jointime
					user.markModified('joinTime')
          await user.save().catch(e => console.log(`Failed to save user join time: ${e}`));
          let data = {}
					data.user = user
					data.config = config
					event.emit('userVoiceUnDeaf', data, member, member.voice.channel, oldDeafType, false)
					return user;
      }
    } else {
		let user = await Voice.findOne({
        userID: member.user.id,
        guildID: member.guild.id
    });
		let channel = member.voice.channel
		let data = {}
		data.config = config
		if(!user){
		data.user = null
		return event.emit('userVoiceUnDeaf', data, member, channel, oldDeafType, true);
		}
		data.user = user
		return event.emit('userVoiceUnDeaf', data, member, channel, oldDeafType, false);
		}
  }
}