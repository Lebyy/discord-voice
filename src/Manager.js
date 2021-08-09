const { EventEmitter } = require("events");
const merge = require("deepmerge");
const { writeFile, readFile, exists } = require("fs");
const { promisify } = require("util");
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const {
  defaultVoiceManagerOptions,
  defaultUserOptions,
  defaultConfigOptions,
  VoiceManagerOptions,
  UserOptions,
  ConfigOptions,
  UserData,
  ConfigData,
} = require("./Constants.js");
const Config = require("./Config.js");
const User = require("./User.js");

/**
 * Voice Manager
 * @example 
 * // Requires Manager from discord-voice
 * const { VoiceManager } = require("discord-voice");
 * // Create a new instance of the manager class
 * const manager = new VoiceManager(client, {
 * userStorage: "./users.json",
 * configStorage: "./configs.json",
 * checkMembersEvery: 5000,
 * default: {
 *   trackBots: false,
 *   trackAllChannels: true,
 * },
 * });
 * // We now have a voiceManager property to access the manager everywhere!
 * client.voiceManager = manager;
 */
class VoiceManager extends EventEmitter {
  /**
   * @param {Client} client The Discord Client
   * @param {VoiceManagerOptions} options The manager options
   */
  constructor(client, options, init = true) {
    super();
    if (!client?.options)
      throw new Error(`Client is a required option. (val=${client})`);
    /**
     * The Discord Client
     * @type {Client}
     */
    this.client = client;
    /**
     * Whether the manager is ready
     * @type {Boolean}
     */
    this.ready = false;
    /**
     * The user's managed by this manager
     * @type {User[]}
     */
    this.users = [];
    /**
     * The config's managed by this manager
     * @type {Config[]}
     */
    this.configs = [];
    /**
     * The manager options
     * @type {VoiceManagerOptions}
     */
    this.options = merge(defaultVoiceManagerOptions, options);
    if (init) this._init();
  }
  /**
   * Creates a new user in the database
   *
   * @param {Snowflake} userId The id of the user
   * @param {Snowflake} guildId The guild id of the user
   * @param {UserOptions} options The options for the user 
   *
   * @returns {Promise<User>}
   *
   * @example
   * manager.createUser(message.author.id, message.guild.id, {
   *      levelingData: {
   *      xp: 0,
   *      level: 0,
   *      },
   *      // The user will have 0 xp and 0 level.
   * });
   */
  createUser(userId, guildId, options) {
    return new Promise(async (resolve, reject) => {
      if (!this.ready) {
        return reject("The manager is not ready yet.");
      }
      options =
        options && typeof options === "object"
          ? merge(defaultUserOptions, options)
          : defaultUserOptions;
      if (!userId) {
        return reject(`userId is not a valid user. (val=${userId})`);
      }
      if (!guildId) {
        return reject(`guildId is not a valid guild. (val=${guildId})`);
      }
      const user = new User(this, {
        userId: userId,
        guildId: guildId,
        data: options,
      });
      this.users.push(user);
      await this.saveUser(userId, guildId, user.data);
      resolve(user);
    });
  }
  /**
   * Creates a new config in the database
   *
   * @param {Snowflake} guildId The guild id of the config
   * @param {ConfigOptions} options The options for config
   *
   * @returns {Promise<Config>}
   *
   * @example
   * manager.createConfig(message.author.id, message.guild.id, {
   *      trackBots: false, // If the user is a bot it will not be tracked.
   *      trackAllChannels: true, // All of the channels in the guild will be tracked.
   *      exemptChannels: () => false, // The user will not be tracked in these channels. (This is a function).
   *      channelIDs: [], // The channel ids to track. (If trackAllChannels is true, this is ignored)
   *      exemptPermissions: [], // The user permissions to not track.
   *      exemptMembers: () => false, // The user will not be tracked. (This is a function).
   *      trackMute: true, // It will track users if they are muted aswell.
   *      trackDeaf: true, // It will track users if they are deafen aswell.
   *      minUserCountToParticipate: 0, // The min amount of users to be in a channel to be tracked.
   *      maxUserCountToParticipate: 0, // The max amount of users to be in a channel to be tracked.
   *      minXPToParticipate: 0, // The min amount of xp needed to be tracked.
   *      minLevelToParticipate: 0, // The min level needed to be tracked.
   *      maxXPToParticipate: 0, // The max amount of xp needed to be tracked.
   *      maxLevelToParticipate: 0, // The max level needed to be tracked.
   *      xpAmountToAdd: () => Math.floor(Math.random() * 10) + 1, // The amount of xp to add to the user (This is a function).
   *      voiceTimeToAdd: () => 1000, // The amount of time in ms to add to the user (This is a function).
   *      voiceTimeTrackingEnabled: true, // Whether the voiceTimeTracking module is enabled.
   *      levelingTrackingEnabled: true, // Whether the levelingTracking module is enabled.
   * });
   */
  createConfig(guildId, options) {
    return new Promise(async (resolve, reject) => {
      if (!this.ready) {
        return reject("The manager is not ready yet.");
      }
      options =
        options && typeof options === "object"
          ? merge(defaultConfigOptions, options)
          : defaultConfigOptions;
      if (!guildId) {
        return reject(`guildId is not a valid guild. (val=${guildId})`);
      }
      const config = new Config(this, {
        guildId: guildId,
        data: options,
      });
      this.configs.push(config);
      await this.saveConfig(guildId, config.data);
      resolve(config);
    });
  }

  removeUser(userId, guildId) {
    return new Promise(async (resolve, reject) => {
      const user = this.users.find(
        (u) => u.guildId === guildId && u.userId === userId
      );
      if (!user) {
        return reject(
          "No user found with ID " +
            userId +
            " in guild with ID" +
            guildId +
            "."
        );
      }
      this.users = this.users.filter(
        (d) =>
          d !==
          {
            userId: userId,
            guildId: guildId,
            data: user.data.data,
          }
      );
      await this.deleteUser(messageID);
      resolve();
    });
  }
  removeConfig(guildId) {
    return new Promise(async (resolve, reject) => {
      const config = this.configs.find((c) => c.guildId === guildId);
      if (!config) {
        return reject("No config found for guild with ID " + guildId + ".");
      }
      this.configs = this.configs.filter((c) => c.guildId !== guildId);
      await this.deleteConfig(messageID);
      resolve();
    });
  }
  updateUser(userId, guildId, options = {}) {
    return new Promise(async (resolve, reject) => {
      const user = this.users.find(
        (u) => u.guildId === guildId && u.userId === userId
      );
      if (!user) {
        return reject(
          "No user found with ID " +
            userId +
            " in guild with ID" +
            guildId +
            "."
        );
      }
      user.edit(options).then(resolve).catch(reject);
    });
  }
  updateConfig(guildId, options = {}) {
    return new Promise(async (resolve, reject) => {
      const config = this.configs.find((c) => c.guildId === guildId);
      if (!config) {
        return reject("No config found for guild with ID " + guildId + ".");
      }
      config.edit(options).then(resolve).catch(reject);
    });
  }

  async deleteUser(userId, guildId) {
    await writeFileAsync(
      this.options.userStorage,
      JSON.stringify(this.users.map((user) => user.data)),
      "utf-8"
    );
    this.refreshUserStorage();
    return;
  }

  async deleteConfig(guildId) {
    await writeFileAsync(
      this.options.configStorage,
      JSON.stringify(this.configs.map((config) => config.data)),
      "utf-8"
    );
    this.refreshConfigStorage();
    return;
  }

  async refreshUserStorage() {
    return true;
  }

  async refreshConfigStorage() {
    return true;
  }

  async editUser(_userID, _guildID, _userData) {
    await writeFileAsync(
      this.options.userStorage,
      JSON.stringify(this.users.map((user) => user.data)),
      "utf-8"
    );
    this.refreshUserStorage();
    return;
  }

  async editConfig(_guildID, _configData) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.configs.map((config) => config.data)),
      "utf-8"
    );
    this.refreshConfigStorage();
    return;
  }

  async saveUser(userId, guildId, userData) {
    await writeFileAsync(
      this.options.userStorage,
      JSON.stringify(this.users.map((user) => user.data)),
      "utf-8"
    );
    this.refreshUserStorage();
    return;
  }

  async saveConfig(guildId, configData) {
    await writeFileAsync(
      this.options.configStorage,
      JSON.stringify(this.configs.map((config) => config.data)),
      "utf-8"
    );
    this.refreshConfigStorage();
    return;
  }

  async getAllUsers() {
    const storageExists = await existsAsync(this.options.userStorage);
    if (!storageExists) {
      await writeFileAsync(this.options.userStorage, "[]", "utf-8");
      return [];
    } else {
      const storageContent = await readFileAsync(this.options.userStorage);
      try {
        const users = await JSON.parse(storageContent.toString());
        if (Array.isArray(users)) {
          return users;
        } else {
          console.log(storageContent, users);
          throw new SyntaxError(
            "The storage file is not properly formatted (users is not an array)."
          );
        }
      } catch (e) {
        if (e.message === "Unexpected end of JSON input") {
          throw new SyntaxError(
            "The storage file is not properly formatted (Unexpected end of JSON input)."
          );
        } else {
          throw e;
        }
      }
    }
  }

  async getAllConfigs() {
    const storageExists = await existsAsync(this.options.configStorage);
    if (!storageExists) {
      await writeFileAsync(this.options.configStorage, "[]", "utf-8");
      return [];
    } else {
      const storageContent = await readFileAsync(this.options.configStorage);
      try {
        const configs = await JSON.parse(storageContent.toString());
        if (Array.isArray(configs)) {
          return configs;
        } else {
          console.log(storageContent, configs);
          throw new SyntaxError(
            "The storage file is not properly formatted (configs is not an array)."
          );
        }
      } catch (e) {
        if (e.message === "Unexpected end of JSON input") {
          throw new SyntaxError(
            "The storage file is not properly formatted (Unexpected end of JSON input)."
          );
        } else {
          throw e;
        }
      }
    }
  }

  _checkUsers() {
    if (this.users.length <= 0) return;
    this.users.forEach(async (user) => {
      if (user.member && user.channel) {
        let config = this.configs.find((g) => g.guildId === user.guildId);
        if (!config) {
          config = await this.createConfig(user.guildId);
        }
        if (
          !(await config.checkMember(user.member)) ||
          !(await config.checkChannel(user.channel))
        )
          return;
        if (config.voiceTimeTrackingEnabled) {
          let previousVoiceTime;
          user.voiceTime.channels.length <= 0
            ? (previousVoiceTime = {
                channelID: user.channel.id,
                voiceTime: 0,
              })
            : (previousVoiceTime = user.voiceTime.channels.find(
                (chn) => chn.channelID === user.channel.id
              ));
          let index = user.voiceTime.channels.indexOf(previousVoiceTime);
          previousVoiceTime.voiceTime += await config.voiceTimeToAdd();
          if (index === -1) user.voiceTime.channels.push(previousVoiceTime);
          else user.voiceTime.channels[index] = previousVoiceTime;
          user.voiceTime.total = user.voiceTime.channels.reduce(function (
            sum,
            data
          ) {
            return sum + data.voiceTime;
          },
          0);
          if (config.levelingTrackingEnabled) {
            user.levelingData.xp += await config.xpAmountToAdd();
            user.levelingData.level = Math.floor(
              0.1 * Math.sqrt(user.levelingData.xp)
            );
          }
          await this.editUser(user.userId, user.guildId, user.data);
          return;
        } else if (config.levelingTrackingEnabled) {
          user.levelingData.xp += await config.xpAmountToAdd();
          user.levelingData.level = Math.floor(
            0.1 * Math.sqrt(user.levelingData.xp)
          );
          await this.editUser(user.userId, user.guildId, user.data);
          return;
        } else return;
      }
    });
  }

  async _handleVoiceStateUpdate(oldState, newState) {
    if (!oldState.channel && newState.channel) {
      if (!this.users.find((u) => u.userId === newState.member.id)) {
        return await this.createUser(
          newState.member.id,
          newState.member.guild.id
        );
      }
    }
  }

  async _init() {
    const rawUsers = await this.getAllUsers();
    rawUsers.forEach((user) => {
      this.users.push(new User(this, user));
    });
    const rawConfig = await this.getAllConfigs();
    rawConfig.forEach((config) => {
      this.configs.push(new Config(this, config));
    });
    setInterval(() => {
      if (this.client.readyAt) this._checkUsers.call(this);
    }, this.options.checkMembersEvery);
    this.ready = true;
    this.client.on("voiceStateUpdate", (oldState, newState) =>
      this._handleVoiceStateUpdate(oldState, newState)
    );
  }
}

module.exports = VoiceManager;