const _ = require('lodash'),
    File = require('fs'),
    Path = require('path'),
    extractObjectsChangedForCommit = require('./extractObjectsChangedForCommit');

function cleanupIds(ids) {
    return _.chain(ids).uniq().sortBy().value();
}

module.exports = async function (region, path, sha, files) {
    const changes = {
            svtOrCe: [],
            servants: [],
            craftEssences: [],
            skills: [],
            noblePhantasms: [],
            buffs: [],
            funcs: [],
            ai: false,
            assets: false,
            dialog: false,
            event: false,
            gacha: false,
            quest: false,
            shop: false,
        },
        checkForChanges = async (regex) => {
            const matches = fileList.filter(file => file.match(regex));

            fileList = fileList.filter(file => !file.match(regex));

            return matches > 0;
        },
        extractIdsChanged = async (ids, file, callback) => {
            if (fileList.indexOf(file) === -1)
                return;

            const objs = await extractObjectsChangedForCommit(path, sha, file);

            ids.push(...objs.map(callback));
        },
        splitServantAndCe = () => {
            const master = JSON.parse(File.readFileSync(Path.join(path, 'master/mstSvt.json')).toString());

            changes.svtOrCe.forEach(id => {
                const entity = _.find(master, svt => svt.id === id);
                if (entity === undefined)
                    return;

                switch (entity.type) {
                    case 1:
                    case 2:
                        changes.servants.push(entity.collectionNo);
                        break;
                    case 6:
                        changes.craftEssences.push(entity.collectionNo);
                        break;
                }
            });
        };

    let fileList = files.slice();

    await extractIdsChanged(changes.svtOrCe, 'master/mstSvt.json', obj => obj.id);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtCard.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtChange.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtCommandCodeUnlock.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtComment.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtCommentAdd.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtCostume.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtCostumeRelease.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtGroup.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtIndividuality.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtLimit.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtPassiveSkill.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtProfile.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtScript.json', obj => obj.id);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtScriptAdd.json', obj => obj.id);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtSkill.json', obj => obj.svtId);
    await extractIdsChanged(changes.skills, 'master/mstSvtSkill.json', obj => obj.skillId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtSkillRelease.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtTreasureDevice.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtTreasureDeviceRelease.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtVoiceRelation.json', obj => obj.svtId);
    await extractIdsChanged(changes.svtOrCe, 'master/mstSvtVoiceRelation.json', obj => obj.relationSvtId);
    fileList = fileList.filter(file => !file.match(/^master\/mstSvt/));

    await extractIdsChanged(changes.skills, 'master/mstSkill.json', obj => obj.id);
    await extractIdsChanged(changes.skills, 'master/mstSkillDetail.json', obj => obj.id);
    await extractIdsChanged(changes.skills, 'master/mstSkillLv.json', obj => obj.skillId);
    fileList = fileList.filter(file => !file.match(/^master\/mstSkill/));

    await extractIdsChanged(changes.noblePhantasms, 'master/mstTreasureDevice.json', obj => obj.id);
    await extractIdsChanged(changes.noblePhantasms, 'master/mstTreasureDeviceDetail.json', obj => obj.id);
    await extractIdsChanged(changes.noblePhantasms, 'master/mstTreasureDeviceLv.json', obj => obj.treaureDeviceId);
    fileList = fileList.filter(file => !file.match(/^master\/mstTreasureDevice/));

    await extractIdsChanged(changes.buffs, 'master/mstBuff.json', obj => obj.id);
    fileList = fileList.filter(file => !file.match(/^master\/mstBuff/));

    await extractIdsChanged(changes.funcs, 'master/mstFunc.json', obj => obj.id);
    await extractIdsChanged(changes.funcs, 'master/mstFuncGroup.json', obj => obj.funcId);
    fileList = fileList.filter(file => !file.match(/^master\/mstFunc/));

    fileList = fileList.filter(file => file !== 'gamedatatop.json');
    changes.ai = checkForChanges(/^master\/mstAi/);
    changes.assets = checkForChanges(/^AssetStorage/);
    changes.dialog = checkForChanges(/^(?:Localization|ScriptActionEncrypt)/);
    changes.event = checkForChanges(/^master\/mstEvent/);
    changes.gacha = checkForChanges(/^master\/mstGacha/);
    changes.quest = checkForChanges(/^master\/(?:mstQuest|mstMap|mstStage|mstSpot|mstWar|npcFollower|npcSvtFollower|viewEnemy|viewQuest)/);
    changes.shop = checkForChanges(/^master\/mstShop/);

    splitServantAndCe();
    changes.servants = cleanupIds(changes.servants);
    changes.craftEssences = cleanupIds(changes.craftEssences);
    changes.skills = cleanupIds(changes.skills);
    changes.noblePhantasms = cleanupIds(changes.noblePhantasms);
    changes.buffs = cleanupIds(changes.buffs);
    changes.funcs = cleanupIds(changes.funcs);

    const outputLines = [];
    outputLines.push(`Changes for ${region}`);
    outputLines.push('');

    if (changes.servants.length) {
        outputLines.push('Servants Updated')
        outputLines.push(...changes.servants.map(id => `<https://apps.atlasacademy.io/db/#/${region}/servant/${id}>`));
        outputLines.push('');
    }

    if (changes.craftEssences.length) {
        outputLines.push('Craft Essences Updated')
        outputLines.push(...changes.craftEssences.map(id => `<https://apps.atlasacademy.io/db/#/${region}/craft-essence/${id}>`));
        outputLines.push('');
    }

    if (changes.skills.length) {
        outputLines.push('Skills Updated')
        outputLines.push(...changes.skills.map(id => `<https://apps.atlasacademy.io/db/#/${region}/skill/${id}>`));
        outputLines.push('');
    }

    if (changes.noblePhantasms.length) {
        outputLines.push('NPs Updated')
        outputLines.push(...changes.skills.map(id => `<https://apps.atlasacademy.io/db/#/${region}/noble-phantasm/${id}>`));
        outputLines.push('');
    }

    if (changes.buffs.length) {
        outputLines.push('Buffs Updated')
        outputLines.push(...changes.skills.map(id => `<https://apps.atlasacademy.io/db/#/${region}/buff/${id}>`));
        outputLines.push('');
    }

    if (changes.funcs.length) {
        outputLines.push('Funcs Updated')
        outputLines.push(...changes.skills.map(id => `<https://apps.atlasacademy.io/db/#/${region}/func/${id}>`));
        outputLines.push('');
    }

    if (changes.ai)
        outputLines.push('AI Updated');
    if (changes.event)
        outputLines.push('Event changes');
    if (changes.gacha)
        outputLines.push('Gacha updated');
    if (changes.quest)
        outputLines.push('Quests updated');
    if (changes.shop)
        outputLines.push('Shops updated');

    return outputLines.join('\n');
}