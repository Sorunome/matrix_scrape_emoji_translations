const fs = require("fs");

const REACT_SDK_PATH = "/home/sorunome/repos/matrix-react-sdk";

const translationsPath = "/src/i18n/strings";
const emojiFile = "./sas-emoji.json";
const outFile = "./sas-emoji-translations.json";

const out = {};

const emoji = JSON.parse(fs.readFileSync(emojiFile));

const dir = fs.readdirSync(REACT_SDK_PATH + translationsPath);
for (const f of dir) {
	if (!f.includes(".json")) {
		continue;
	}
	const langJson = JSON.parse(fs.readFileSync(REACT_SDK_PATH + translationsPath + "/" + f));
	const lang = f.replace(".json", "");
	const translation = [];
	for (const e of emoji) {
		if (e.description === "Thumbs Up") {
			e.description = "Thumbs up";
		}
		if (e.description === "Light Bulb") {
			e.description = "Light bulb";
		}
		if (!langJson[e.description]) {
			if (lang == "en_EN") {
				console.log("MISSING:", e);
			}
			continue;
		}
		translation.push(langJson[e.description]);
	}
	if (translation.length != emoji.length) {
		continue;
	}
	out[lang] = translation;
}
fs.writeFileSync(outFile, JSON.stringify(out));
