const fs = require("fs");
const xml2json = require("xml2json");

const REACT_SDK_PATH = "/home/sorunome/repos/matrix-react-sdk";
const RIOT_X_PATH = "/home/sorunome/repos/riotX-android";
const RIOT_IOS_PATH = "/home/sorunome/repos/riot-ios";

const reactSdkTranslationsPath = "/src/i18n/strings";
const riotXTranslationsPath = "/matrix-sdk-android/src/main/res";
const riotIosTranslationsPath = "/Riot/Assets";
const emojiFile = "./sas-emoji.json";
const outFile = "./sas-emoji-translations.json";
const outFileLang = "./sas-emoji-languages.json";

const out = {};
const languages = [];

const emoji = JSON.parse(fs.readFileSync(emojiFile));

const reactSdkCache = {};
function getEmoteReactSdk(lang, str) {
	if (str === "Thumbs Up") {
		str = "Thumbs up";
	}
	if (str === "Light Bulb") {
		str = "Light bulb";
	}
	const langMap = {
		"zh_TW": "zh_Hant",
		"zh_CN": "zh_Hans",
	};
	lang = langMap[lang] || lang;
	if (!reactSdkCache[lang]) {
		let file;
		try {
			file = fs.readFileSync(REACT_SDK_PATH + reactSdkTranslationsPath + "/" + lang + ".json");
		} catch (err) {
			return;
		}
		reactSdkCache[lang] = JSON.parse(file);
	}
	return reactSdkCache[lang][str];
}

function allReactSdkLangs() {
	const langs = [];
	const dir = fs.readdirSync(REACT_SDK_PATH + reactSdkTranslationsPath);
	for (const f of dir) {
		if (!f.includes(".json")) {
			continue;
		}
		let lang = f.replace(".json", "");
		const langMap = {
			"zh_Hant": "zh_TW",
			"zh_Hans": "zh_CN",
		};
		lang = langMap[lang] || lang;
		langs.push(lang);
	}
	return langs;
}

const riotXCache = {};
function getEmoteRiotX(lang, str) {
	str = str.toLowerCase().replace(" ", "");
	const strMap = {
		"spanner": "wrench",
		"aeroplane": "airplane",
		"headphones": "headphone",
	};
	str = strMap[str] || str;
	const langMap = {
		"en_EN": "en_GB",
		"de_DE": "de",
	};
	lang = langMap[lang] || lang;
	lang = lang.replace("_", "-r");
	if (!riotXCache[lang]) {
		let file;
		try {
			let path = "/values-" + lang;
			if (lang == "en-rUS") {
				path = "/values";
			}
			file = fs.readFileSync(RIOT_X_PATH + riotXTranslationsPath + path + "/strings.xml");
		} catch (err) {
			return;
		}
		riotXCache[lang] = JSON.parse(xml2json.toJson(file));
	}
	try {
		return riotXCache[lang].resources.string.find((e) => e.name === "verification_emoji_" + str)["$t"];
	} catch (err) {
		// dispose
	}
}

function allRiotXLangs() {
	const langs = [];
	const dir = fs.readdirSync(RIOT_X_PATH + riotXTranslationsPath);
	for (const f of dir) {
		if (!f.startsWith("values-")) {
			continue;
		}
		let lang = f.replace("values-", "");
		lang = lang.replace("-r", "_");
		const langMap = {
			"en_GB": "en_EN",
			"de": "de_DE",
		};
		lang = langMap[lang] || lang;
		langs.push(lang);
	}
	langs.push("en_US");
	return langs;
}

const riotIosCache = {};
function getEmoteRiotIos(lang, str) {
	str = str.toLowerCase();
	const langMap = {
		"en_EN": "en",
		"nb_NO": "nb-NO",
		"zh_CN": "zh_Hans",
		"zh_TW": "zh_Hant",
		"de_DE": "de",
	};
	lang = langMap[lang] || lang;
	if (!riotIosCache[lang]) {
		let file;
		try {
			file = fs.readFileSync(RIOT_IOS_PATH + riotIosTranslationsPath + "/" + lang + ".lproj/Vector.strings");
		} catch (err) {
			return;
		}
		langMap[lang] = file.toString().split("\n");
	}
	const line = langMap[lang].find((s) => s && s.startsWith("\"device_verification_emoji_" + str));
	if (!line) {
		return;
	}
	return line.split("\"")[3];
}

function getRiotIosLangs() {
	const langs = [];
	const dir = fs.readdirSync(RIOT_IOS_PATH + riotIosTranslationsPath);
	for (const f of dir) {
		let lang = f.replace(".lproj", "");
		if (lang === "Base") {
			continue;
		}
		const langMap = {
			"en": "en_EN",
			"nb-NO": "nb_NO",
			"zh_Hans": "zh_CN",
			"zh_Hant": "zh_TW",
			"de": "de_DE",
		};
		lang = langMap[lang] || lang;
		langs.push(lang);
	}
	return langs;
}

function getEmote(lang, str) {
	return getEmoteReactSdk(lang, str) || getEmoteRiotX(lang, str) || getEmoteRiotIos(lang, str);
}

const langs = new Set();
allReactSdkLangs().forEach((l) => langs.add(l));
allRiotXLangs().forEach((l) => langs.add(l));
getRiotIosLangs().forEach((l) => langs.add(l));
for (const lang of langs) {
	const translation = [];
	for (const e of emoji) {
		let trans = getEmote(lang, e.description);
		if (!trans && lang === "en_US") {
			trans = getEmote("en_EN", e.description);
		}
		if (!trans && lang === "en_EN") {
			trans = getEmote("en_US", e.description);
		}
		if (!trans) {
			if (lang === "en_EN") {
				console.log("MISSING EMOTE:", e);
			}
			continue;
		}
		translation.push(trans);
	}
	if (translation.length != emoji.length) {
		continue;
	}
	out[lang] = translation;
	languages.push(lang);
}

console.log("Languages (" + languages.length + "):", languages);
fs.writeFileSync(outFile, JSON.stringify(out));
fs.writeFileSync(outFileLang, JSON.stringify(languages));
