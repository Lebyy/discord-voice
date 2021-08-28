const { EventEmitter } = require("events");
const merge = require("deepmerge");
const { writeFile, readFile, exists } = require("fs");
const { promisify } = require("util");
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const lodash = require("lodash");
const { defaultVoiceManagerOptions, defaultUserOptions, defaultConfigOptions, VoiceManagerOptions, UserOptions, ConfigOptions, UserData, ConfigData, UserEditOptions, ConfigEditOptions } = require("./Constants.js");
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
        if (!client?.options) throw new Error(`Client is a required option. (val=${client})`);
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
     * @param {Snowflake} guildId The id of the user's guild
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
            options = options && typeof options === "object" ? merge(defaultUserOptions, options) : defaultUserOptions;
            if (!userId) {
                return reject(`userId is not a valid user. (val=${userId})`);
            }
            if (!guildId) {
                return reject(`guildId is not a valid guild. (val=${guildId})`);
            }
            const user = new User(this, {
                userId: userId,
                guildId: guildId,
                data: options
            });
            this.users.push(user);
            await this.saveUser(userId, guildId, user.data);
            resolve(user);
        });
    }
    /**
     * Creates a new config in the database
     *
     * @param {Snowflake} guildId The id of the config's guild
     * @param {ConfigOptions} options The options for config
     *
     * @returns {Promise<Config>}
     *
     * @example
     * manager.createConfig(message.guild.id, {
     *      trackBots: false, // If the user is a bot it will not be tracked.
     *      trackAllChannels: true, // All of the channels in the guild will be tracked.
     *      exemptChannels: () => false, // The user will not be tracked in these channels. (This is a function).
     *      channelIds: [], // The channel ids to track. (If trackAllChannels is true, this is ignored)
     *      exemptPermissions: [], // The user permissions to not track.
     *      exemptMembers: () => false, // The user will not be tracked. (This is a function).
     *      trackMute: true, // It will track users if they are muted aswell.
     *      trackDeaf: true, // It will track users if they are deafen aswell.
     *      minUserCountToParticipate: 0, // The min amount of users to be in a channel to be tracked.
     *      maxUserCountToParticipate: 0, // The max amount of users to be in a channel to be tracked.
     *      minXpToParticipate: 0, // The min amount of xp needed to be tracked.
     *      minLevelToParticipate: 0, // The min level needed to be tracked.
     *      maxXpToParticipate: 0, // The max amount of xp needed to be tracked.
     *      maxLevelToParticipate: 0, // The max level needed to be tracked.
     *      xpAmountToAdd: () => Math.floor(Math.random() * 10) + 1, // The amount of xp to add to the user (This is a function).
     *      voiceTimeToAdd: () => 1000, // The amount of time in ms to add to the user (This is a function).
     *      voiceTimeTrackingEnabled: true, // Whether the voiceTimeTracking module is enabled.
     *      levelingTrackingEnabled: true, // Whether the levelingTracking module is enabled.
     *      levelMultiplier: () => 0.1, // This will set level multiplier to 0.1 (This is a function).
     * });
     */
    createConfig(guildId, options) {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) {
                return reject("The manager is not ready yet.");
            }
            options = options && typeof options === "object" ? merge(defaultConfigOptions, options) : defaultConfigOptions;
            if (!guildId) {
                return reject(`guildId is not a valid guild. (val=${guildId})`);
            }
            const config = new Config(this, {
                guildId: guildId,
                data: options
            });
            this.configs.push(config);
            await this.saveConfig(guildId, config.data);
            resolve(config);
        });
    }
    /**
     * Remove's the user from the database
     *
     * @param {Snowflake} userId The id of the user
     * @param {Snowflake} guildId The id of the user's guild
     *
     * @returns {Promise<void>}
     *
     * @example
     * manager.removeUser(message.author.id, message.guild.id);
     */
    removeUser(userId, guildId) {
        return new Promise(async (resolve, reject) => {
            const user = this.users.find((u) => u.guildId === guildId && u.userId === userId);
            if (!user) {
                return reject("No user found with Id " + userId + " in guild with Id" + guildId + ".");
            }
            this.users = this.users.filter(
                (d) =>
                    d !==
                    {
                        userId: userId,
                        guildId: guildId,
                        data: user.data.data
                    }
            );
            await this.deleteUser(userId, guildId);
            resolve();
        });
    }
    /**
     * Remove's the config from the database
     *
     * @param {Snowflake} guildId The id of the config's guild
     *
     * @returns {Promise<void>}
     *
     * @example
     * manager.removeConfig(message.guild.id);
     */
    removeConfig(guildId) {
        return new Promise(async (resolve, reject) => {
            const config = this.configs.find((c) => c.guildId === guildId);
            if (!config) {
                return reject("No config found for guild with Id " + guildId + ".");
            }
            this.configs = this.configs.filter((c) => c.guildId !== guildId);
            await this.deleteConfig(guildId);
            resolve();
        });
    }
    /**
     * Edits a user. The modifications will be applicated when the user will be updated.
     * @param {Snowflake} userId The id of the user
     * @param {Snowflake} guildId The id of the user's guild
     * @param {UserEditOptions} options The edit options
     * @returns {Promise<User>}
     *
     * @example
     * manager.updateUser('122925169588043776','815261972450115585', {
     *      newVoiceTime: {
     *      channels: [],
     *      total: 0,
     *      }, // The new voice time user will have.
     * });
     */
    updateUser(userId, guildId, options = {}) {
        return new Promise(async (resolve, reject) => {
            const user = this.users.find((u) => u.guildId === guildId && u.userId === userId);
            if (!user) {
                return reject("No user found with Id " + userId + " in guild with Id" + guildId + ".");
            }
            user.edit(options).then(resolve).catch(reject);
        });
    }
    /**
     * Edits a config.
     * @param {Snowflake} guildId The id of the user's guild
     * @param {ConfigEditOptions} options The edit options
     * @returns {Promise<Config>}
     *
     * @example
     * manager.updateConfig('815261972450115585', {
     *      newTrackBots: true, // The module will now track bot user's voice time aswell.
     * });
     */
    updateConfig(guildId, options = {}) {
        return new Promise(async (resolve, reject) => {
            const config = this.configs.find((c) => c.guildId === guildId);
            if (!config) {
                return reject("No config found for guild with Id " + guildId + ".");
            }
            config.edit(options).then(resolve).catch(reject);
        });
    }
    /**
     * Delete a user from the database
     * @param {Snowflake} userId The id of the user
     * @param {Snowflake} guildId The id of the user's guild
     * @returns {Promise<void>}
     * @ignore
     */
    async deleteUser(userId, guildId) {
        await writeFileAsync(this.options.userStorage, JSON.stringify(this.users.map((user) => user.data)), "utf-8");
        this.refreshUserStorage();
        return;
    }
    /**
     * Delete a config from the database
     * @param {Snowflake} guildId The id of the config's guild
     * @returns {Promise<void>}
     * @ignore
     */
    async deleteConfig(guildId) {
        await writeFileAsync(this.options.configStorage, JSON.stringify(this.configs.map((config) => config.data)), "utf-8");
        this.refreshConfigStorage();
        return;
    }
    /**
     * Refresh the user cache to support shards.
     * @ignore
     */
    async refreshUserStorage() {
        return true;
    }
    /**
     * Refresh the config cache to support shards.
     * @ignore
     */
    async refreshConfigStorage() {
        return true;
    }
    /**
     * Edit the user in the database
     * @ignore
     * @param {Snowflake} userId The id of the user
     * @param {Snowflake} guildId The id of the user's guild
     * @param {UserData} userData The user data to save
     */
    async editUser(_userId, _guildId, _userData) {
        await writeFileAsync(this.options.userStorage, JSON.stringify(this.users.map((user) => user.data)), "utf-8");
        this.refreshUserStorage();
        return;
    }
    /**
     * Edit the config in the database
     * @ignore
     * @param {Snowflake} guildId The id of the config's guild
     * @param {ConfigData} ConfigData The config data to save
     */
    async editConfig(_guildId, _configData) {
        await writeFileAsync(this.options.storage, JSON.stringify(this.configs.map((config) => config.data)), "utf-8");
        this.refreshConfigStorage();
        return;
    }
    /**
     * Save the user in the database
     * @ignore
     * @param {Snowflake} userId The id of the user
     * @param {Snowflake} guildId The id of the user's guild
     * @param {UserData} userData The user data to save
     */
    async saveUser(userId, guildId, userData) {
        await writeFileAsync(this.options.userStorage, JSON.stringify(this.users.map((user) => user.data)), "utf-8");
        this.refreshUserStorage();
        return;
    }
    /**
     * Save the config in the database
     * @ignore
     * @param {Snowflake} guildId The id of the config's guild
     * @param {ConfigData} configData The config data to save
     */
    async saveConfig(guildId, configData) {
        await writeFileAsync(this.options.configStorage, JSON.stringify(this.configs.map((config) => config.data)), "utf-8");
        this.refreshConfigStorage();
        return;
    }
    /**
     * Gets the user's from the storage file, or create it
     * @ignore
     * @returns {Promise<UserData[]>}
     */
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
                    throw new SyntaxError("The storage file is not properly formatted (users is not an array).");
                }
            } catch (e) {
                if (e.message === "Unexpected end of JSON input") {
                    throw new SyntaxError("The storage file is not properly formatted (Unexpected end of JSON input).");
                } else {
                    throw e;
                }
            }
        }
    }
    /**
     * Gets the config's from the storage file, or create it
     * @ignore
     * @returns {Promise<ConfigData[]>}
     */
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
                    throw new SyntaxError("The storage file is not properly formatted (configs is not an array).");
                }
            } catch (e) {
                if (e.message === "Unexpected end of JSON input") {
                    throw new SyntaxError("The storage file is not properly formatted (Unexpected end of JSON input).");
                } else {
                    throw e;
                }
            }
        }
    }
    /**
     * Checks each user and update it if needed
     * @ignore
     * @private
     */
    _checkUsers() {
        if (this.users.length <= 0) return;
        this.users.forEach(async (user) => {
            if (user.member && user.channel) {
                let config = this.configs.find((g) => g.guildId === user.guildId);
                if (!config) {
                    config = await this.createConfig(user.guildId);
                }
                if (!((await config.checkMember(user.member)) && (await config.checkChannel(user.channel)))) return;
                const oldUser = lodash._.cloneDeep(user);
                if (config.voiceTimeTrackingEnabled) {
                    let previousVoiceTime;
                    user.voiceTime.channels.length <= 0
                        ? (previousVoiceTime = {
                              channelId: user.channel.id,
                              voiceTime: 0
                          })
                        : user.voiceTime.channels.find((chn) => chn.channelId === user.channel.id)
                        ? (previousVoiceTime = user.voiceTime.channels.find((chn) => chn.channelId === user.channel.id))
                        : (previousVoiceTime = {
                              channelId: user.channel.id,
                              voiceTime: 0
                          });
                    let index = user.voiceTime.channels.indexOf(previousVoiceTime);
                    previousVoiceTime.voiceTime += await config.voiceTimeToAdd();
                    if (index === -1) user.voiceTime.channels.push(previousVoiceTime);
                    else user.voiceTime.channels[index] = previousVoiceTime;
                    user.voiceTime.total = user.voiceTime.channels.reduce(function (sum, data) {
                        return sum + data.voiceTime;
                    }, 0);
                    /**
                     * Emitted when voice time is added to the user.
                     * @event VoiceManager#userVoiceTimeAdd
                     * @param {User} oldUser The user before the update
                     * @param {User} newUser The user after the update
                     *
                     */
                    this.emit("userVoiceTimeAdd", oldUser, user);
                }
                if (config.levelingTrackingEnabled) {
                    user.levelingData.xp += await config.xpAmountToAdd();
                    user.levelingData.level = Math.floor((await config.levelMultiplier()) * Math.sqrt(user.levelingData.xp));
                    /**
                     * Emitted when xp is added to the user.
                     * @event VoiceManager#userXpAdd
                     * @param {User} oldUser The user before the update
                     * @param {User} newUser The user after the update
                     *
                     */
                    this.emit("userXpAdd", oldUser, user);
                    if (user.levelingData.level > oldUser.levelingData.level) {
                        /**
                         * Emitted when the user levels up.
                         * @event VoiceManager#userLevelUp
                         * @param {User} oldUser The user before the update
                         * @param {User} newUser The user after the update
                         *
                         */
                        this.emit("userLevelUp", oldUser, user);
                    }
                }
                await this.editUser(user.userId, user.guildId, user.data);
                return;
            }
        });
    }
    /**
     * Checks the provided user
     * @ignore
     * @private
     */
    async _checkUser(member) {
        let config = this.configs.find((g) => g.guildId === member.guild.id);
        if (!config) {
            config = await this.createConfig(member.guild.id);
        }
        if (!((await config.checkMember(member)) && (await config.checkChannel(member.channel)))) return false;
        else return await this.createUser(member.id, member.guild.id);
    }
    /**
     * Saves the new user to the storage file
     * @ignore
     * @private
     */
    async _handleVoiceStateUpdate(oldState, newState) {
        if (newState.channel) {
            if (!this.users.find((u) => u.userId === newState.member.id)) {
                let config = this.configs.find((g) => g.guildId === newState.member.guild.id);
                if (!config) {
                    config = await this.createConfig(newState.member.guild.id);
                }
                if (!(await config.checkMember(newState.member)) || !(await config.checkChannel(newState.channel))) return;
                else return await this.createUser(newState.member.id, newState.member.guild.id);
            }
        }
    }
    /**
     * Inits the manager
     * @ignore
     * @private
     */
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
        this.client.on("voiceStateUpdate", (oldState, newState) => this._handleVoiceStateUpdate(oldState, newState));
    }
}

module.exports = VoiceManager;
