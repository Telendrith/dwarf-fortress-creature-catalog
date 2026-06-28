// Global statistical registry arrays for percentiles
let allWeights = [];
let allGaits = [];
let animInterval = null; // Walk-cycle animation timer

// Biome translation dictionary
const BIOME_LABELS = {
  "MOUNTAIN": "Mountains",
  "GLACIER": "Glaciers",
  "TUNDRA": "Tundra Moors",
  "SWAMP_TEMPERATE_FRESHWATER": "Temperate Freshwater Swamps",
  "SWAMP_TEMPERATE_SALTWATER": "Temperate Saltwater Swamps",
  "SWAMP_TROPICAL_FRESHWATER": "Tropical Freshwater Swamps",
  "SWAMP_TROPICAL_SALTWATER": "Tropical Saltwater Swamps",
  "MARSH_TEMPERATE_FRESHWATER": "Temperate Freshwater Marshes",
  "MARSH_TEMPERATE_SALTWATER": "Temperate Saltwater Marshes",
  "MARSH_TROPICAL_FRESHWATER": "Tropical Freshwater Marshes",
  "MARSH_TROPICAL_SALTWATER": "Tropical Saltwater Marshes",
  "FOREST_TEMPERATE_CONIFER": "Temperate Coniferous Forests",
  "FOREST_TEMPERATE_BROADLEAF": "Temperate Broadleaf Forests",
  "FOREST_TROPICAL_CONIFER": "Tropical Coniferous Forests",
  "FOREST_TROPICAL_DRY": "Tropical Dry Broadleaf Forests",
  "FOREST_TROPICAL_WET": "Tropical Wet Rainforests",
  "DESERT_BADLAND": "Badland Deserts",
  "DESERT_ROCKY": "Rocky Deserts",
  "DESERT_SAND": "Sandy Deserts",
  "GRASSLAND_TEMPERATE": "Temperate Grasslands / Meadows",
  "GRASSLAND_TROPICAL": "Tropical Grasslands / Savannas",
  "SHRUBLAND_TEMPERATE": "Temperate Shrublands",
  "SHRUBLAND_TROPICAL": "Tropical Shrublands",
  "OCEAN_TROPICAL": "Tropical Oceans",
  "OCEAN_TEMPERATE": "Temperate Oceans",
  "OCEAN_ARCTIC": "Arctic Frozen Oceans",
  "POOL_TEMPERATE_FRESHWATER": "Temperate Freshwater Pools",
  "POOL_TEMPERATE_SALTWATER": "Temperate Saltwater Pools",
  "POOL_TROPICAL_FRESHWATER": "Tropical Freshwater Pools",
  "POOL_TROPICAL_SALTWATER": "Tropical Saltwater Pools",
  "LAKE_TEMPERATE_FRESHWATER": "Temperate Freshwater Lakes",
  "LAKE_TEMPERATE_SALTWATER": "Temperate Saltwater Lakes",
  "LAKE_TROPICAL_FRESHWATER": "Tropical Freshwater Lakes",
  "LAKE_TROPICAL_SALTWATER": "Tropical Saltwater Pools",
  "RIVER_TEMPERATE_FRESHWATER": "Temperate Freshwater Rivers",
  "RIVER_TEMPERATE_SALTWATER": "Temperate Saltwater Rivers",
  "RIVER_TROPICAL_FRESHWATER": "Tropical Freshwater Rivers",
  "RIVER_TROPICAL_SALTWATER": "Tropical Saltwater Rivers",
  "SUBTERRANEAN_WATER": "Subterranean Cavern Waters",
  "SUBTERRANEAN_CHASM": "Subterranean Cavern Chasms",
  "SUBTERRANEAN_LAVA": "Magma Lakes & Volcanic Chasms"
};

const BODY_PLAN_LABELS = {
  "STANDARD_MATERIALS": "Standard Biological Composition",
  "VERTEBRATE_TISSUE_LAYERS": "Vertebrate Tissue Structure",
  "EXOSKELETON_TISSUE_LAYERS": "Exoskeleton Invertebrate Armor",
  "HAIR": "Fur / Hair Coat",
  "SCALES": "Reptilian Scales",
  "FEATHERS": "Avian Feathers",
  "CHITIN": "Chitinous Shell Layers",
  "TEETH": "Standard Teeth",
  "GENERIC_TEETH_WITH_LARGE_EYE_TEETH": "Fanged Dentition (Enlarged Canines)",
  "VERTEBRATE_TISSUE_LAYERS_NO_FAT": "Fatless Vertebrate Tissues",
  "VERTEBRATE_TISSUE_LAYERS_NO_BONE": "Boneless Vertebrate Tissues",
  "STANDARD_TISSUES": "Organic Tissues",
  "SKIN": "Standard Outer Skin",
  "FAT": "Insulating Fat Layer",
  "MUSCLE": "Striated Muscle Tissue",
  "BONE": "Skeletal Bone Structure",
  "CARTILAGE": "Flexible Cartilage",
  "NAILS": "Protective Nails / Claws"
};

// Convert volume in cm3 to weights
function getAdultSize(bodySizes) {
  if (!bodySizes || bodySizes.length === 0) return 0;
  const lastTag = bodySizes[bodySizes.length - 1];
  const match = lastTag.match(/BODY_SIZE:\d+:\d+:(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function formatBodySize(sizeGrams) {
  if (!sizeGrams || sizeGrams <= 0) return 'Unknown';
  const kg = sizeGrams / 1000;
  const lbs = Math.round(kg * 2.20462);
  let classification = getSizeCategory(sizeGrams);
  
  if (kg < 1) {
    return `${Math.round(sizeGrams)} g (${lbs.toFixed(2)} lbs) — ${classification}`;
  }
  return `${kg.toLocaleString(undefined, {maximumFractionDigits: 1})} kg (${lbs.toLocaleString()} lbs) — ${classification}`;
}

function estimateBodyDimensions(sizeCm3, isHumanoid) {
  if (!sizeCm3 || sizeCm3 <= 0) return 'Unknown Size';
  
  if (isHumanoid) {
    // Standing height (Human default is 70000 cm3 -> 175 cm tall)
    const heightCm = 175 * Math.pow(sizeCm3 / 70000, 1/3);
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    
    if (heightCm < 30) {
      return `Est. Height: ${Math.round(heightCm)} cm (${Math.round(totalInches)} in)`;
    }
    return `Est. Height: ${Math.round(heightCm)} cm (${feet}'${inches}")`;
  } else {
    // Length/shoulder height (Dog default is 25000 cm3 -> 75 cm length)
    const lengthCm = 75 * Math.pow(sizeCm3 / 25000, 1/3);
    const totalInches = lengthCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    
    if (lengthCm < 30) {
      return `Est. Length: ${Math.round(lengthCm)} cm (${Math.round(totalInches)} in)`;
    }
    return `Est. Length: ${Math.round(lengthCm)} cm (${feet}'${inches}")`;
  }
}

function getSizeCategory(sizeGrams) {
  const sizeKg = sizeGrams / 1000;
  if (sizeKg < 0.2) return 'Tiny (like a toad)';
  if (sizeKg < 2) return 'Very Small (like a rabbit)';
  if (sizeKg < 15) return 'Small (like a cat/badger)';
  if (sizeKg < 70) return 'Medium-Small (like a dog/wolf)';
  if (sizeKg < 250) return 'Medium (like a human/black bear)';
  if (sizeKg < 1000) return 'Large (like a horse/grizzly)';
  if (sizeKg < 4000) return 'Huge (like a rhino/mammoth)';
  return 'Gigantic (like a dragon/whale)';
}

// Husbandry estimate butcher yield
function estimateButcherYield(sizeGrams) {
  if (!sizeGrams || sizeGrams < 50000) return 'Minor (size too small)';
  const units = Math.round(sizeGrams / 100000);
  return `~${Math.max(1, units)} units meat/fat`;
}

// Pre-calculate lists for percentile functions
function preprocessData(creatures) {
  allWeights = creatures
    .map(c => getAdultSize(c.body_sizes))
    .filter(w => w > 0)
    .sort((a, b) => a - b);
    
  allGaits = creatures
    .map(c => c.gait_speed)
    .filter(g => g !== null && g > 0)
    .sort((a, b) => b - a); // descending order: slow gait delays first
}

function getWeightPercentile(weight) {
  if (weight <= 0 || allWeights.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < allWeights.length; i++) {
    if (allWeights[i] < weight) count++;
    else break;
  }
  return Math.round((count / allWeights.length) * 100);
}

function getSpeedPercentile(gait) {
  if (gait === null || gait <= 0 || allGaits.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < allGaits.length; i++) {
    if (allGaits[i] > gait) count++;
    else break;
  }
  return Math.round((count / allGaits.length) * 100);
}

// Tiers classifications
function getCombatTier(rating) {
  const val = rating || 0;
  if (val >= 90) return { tier: 'S-Tier', name: 'Legendary Apex' };
  if (val >= 75) return { tier: 'A-Tier', name: 'Heavy Predator' };
  if (val >= 50) return { tier: 'B-Tier', name: 'Soldier Beast' };
  if (val >= 25) return { tier: 'C-Tier', name: 'Territorial' };
  if (val >= 10) return { tier: 'D-Tier', name: 'Passive Wild' };
  return { tier: 'E-Tier', name: 'Harmless Prey' };
}

function getEconomicTier(rating) {
  const val = rating || 0;
  if (val >= 90) return { tier: 'S-Tier', name: 'Industry Apex' };
  if (val >= 70) return { tier: 'A-Tier', name: 'High Yield' };
  if (val >= 40) return { tier: 'B-Tier', name: 'Standard Farm' };
  if (val >= 15) return { tier: 'C-Tier', name: 'Wild Harvest' };
  return { tier: 'D-Tier', name: 'No Yield' };
}

function formatBiomeName(biomeTag) {
  if (!biomeTag) return 'Unknown';
  if (BIOME_LABELS[biomeTag]) return BIOME_LABELS[biomeTag];
  for (const key in BIOME_LABELS) {
    if (biomeTag.startsWith(key)) return BIOME_LABELS[key];
  }
  return biomeTag.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function getBiomeWikiUrl(biomeId) {
  const b = biomeId.toUpperCase();
  if (b.includes('TUNDRA')) return 'https://dwarffortresswiki.org/index.php/Tundra';
  if (b.includes('GLACIER')) return 'https://dwarffortresswiki.org/index.php/Glacier';
  if (b.includes('DESERT')) return 'https://dwarffortresswiki.org/index.php/Desert';
  if (b.includes('FOREST')) return 'https://dwarffortresswiki.org/index.php/Forest';
  if (b.includes('SWAMP')) return 'https://dwarffortresswiki.org/index.php/Swamp';
  if (b.includes('MARSH')) return 'https://dwarffortresswiki.org/index.php/Marsh';
  if (b.includes('GRASSLAND')) return 'https://dwarffortresswiki.org/index.php/Grassland';
  if (b.includes('SHRUBLAND')) return 'https://dwarffortresswiki.org/index.php/Shrubland';
  if (b.includes('OCEAN')) return 'https://dwarffortresswiki.org/index.php/Ocean';
  if (b.includes('MOUNTAIN')) return 'https://dwarffortresswiki.org/index.php/Mountain';
  if (b.includes('LAKE') || b.includes('POOL')) return 'https://dwarffortresswiki.org/index.php/Lake';
  if (b.includes('RIVER')) return 'https://dwarffortresswiki.org/index.php/River';
  if (b.includes('SUBTERRANEAN') || b.includes('UNDERWORLD')) return 'https://dwarffortresswiki.org/index.php/Subterranean';
  return 'https://dwarffortresswiki.org/index.php/Biome';
}

let wikiBiomes = {};

// Load biome wiki descriptions asynchronously
fetch('data/wiki_biomes.json')
  .then(res => res.json())
  .then(data => {
    wikiBiomes = data;
  })
  .catch(err => console.error('Failed to load wiki biomes reference:', err));

function getBiomeDescription(biomeId) {
  const b = biomeId.toUpperCase();
  for (const key of Object.keys(wikiBiomes)) {
    if (b.includes(key)) return wikiBiomes[key];
  }
  return 'Click to view the Dwarf Fortress Wiki guide.';
}

function updateBiomeInfo(biomeId) {
  const box = document.getElementById('biome-wiki-info-box');
  if (box) {
    box.textContent = getBiomeDescription(biomeId);
    box.style.color = 'var(--text-accent)';
  }
}

function resetBiomeInfo() {
  const box = document.getElementById('biome-wiki-info-box');
  if (box) {
    box.textContent = 'Hover over any biome badge to reveal details from the Dwarf Fortress Wiki.';
    box.style.color = 'var(--text-muted)';
  }
}

function formatGaitSpeed(speed) {
  if (speed === null || speed <= 0) return 'Aquatic / No land speed';
  let cat = '';
  if (speed <= 200) cat = 'Extremely Swift';
  else if (speed <= 400) cat = 'Very Fast';
  else if (speed <= 660) cat = 'Swift / Moderate';
  else if (speed <= 1000) cat = 'Moderate / Slow';
  else cat = 'Sluggish';
  
  return `${speed} delay (${cat})`;
}

function formatMaxAge(maxAgeStr) {
  if (!maxAgeStr || maxAgeStr === "None") return 'Immortal / Ageless';
  const match = maxAgeStr.match(/MAXAGE:(\d+):(\d+)/);
  if (match) {
    return `${match[1]} to ${match[2]} years`;
  }
  return maxAgeStr;
}

function formatSourceFile(fileStr) {
  if (!fileStr) return 'Unknown File';
  let clean = fileStr.replace('creature_', '').replace('.txt', '').replace(/_/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getPriceTierClass(valStr) {
  const val = parseInt(valStr);
  if (isNaN(val) || val <= 0) return '';
  if (val <= 30) return 'price-tier-cheap';
  if (val <= 100) return 'price-tier-common';
  if (val <= 300) return 'price-tier-uncommon';
  if (val <= 800) return 'price-tier-expensive';
  return 'price-tier-legendary';
}

function getCreatureType(c) {
  if (c.is_aquatic && !c.is_amphibious) return 'aquatic';
  if (c.is_amphibious) return 'amphibious';
  if (c.is_prehistoric || c.creature_classes.includes('REAL_WORLD_EXTINCT')) return 'prehistoric';
  if (c.source_file.includes('subterranean') || c.biomes.some(b => b.includes('SUBTERRANEAN'))) return 'cavern';
  return 'surface';
}

function getSpeedPercent(speed) {
  if (!speed) return 100;
  const minSpeed = 100;
  const maxSpeed = 2000;
  const pct = ((speed - minSpeed) / (maxSpeed - minSpeed)) * 100;
  return Math.max(0, Math.min(100, pct));
}

function getAttackBlurb(atk) {
  const bodySource = atk.body_part_source.toLowerCase().replace(/_/g, ' ');
  const multVal = atk.velocity_multiplier / 1000;
  const speedDesc = multVal > 1.5 ? 'extreme speed' : 
                    multVal > 1.1 ? 'quick speed' : 
                    multVal < 0.9 ? 'slow, crushing speed' : 'standard strike speed';
                    
  const damageDesc = atk.attack_type === 'edged' ? 'sharp, slicing edged cuts' : 'blunt, bone-breaking crushing damage';
  
  return `Delivers a ${atk.name.toLowerCase()} using its ${bodySource}. Strikes with ${speedDesc} (${multVal.toFixed(1)}x velocity) over a target focus contact area of ${Math.round(atk.contact_area_min)}, dealing ${damageDesc}.`;
}

function getAnatomyLabel(planName) {
  return BODY_PLAN_LABELS[planName] || planName.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

// Set sprite state inside animator viewport
function toggleAnimState(creatureId, state, btn) {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  
  const tabs = btn.parentNode.querySelectorAll('.state-tab');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  
  const imgEl = document.getElementById('state-sprite-img');
  if (!imgEl) return;
  
  const defaultUrl = `data/images/states/${creatureId}_default.png`;
  const animatedUrl = `data/images/states/${creatureId}_animated.png`;
  const childUrl = `data/images/states/${creatureId}_child.png`;
  const corpseUrl = `data/images/states/${creatureId}_corpse.png`;
  
  if (state === 'default') {
    imgEl.src = defaultUrl;
  } else if (state === 'child') {
    imgEl.src = childUrl;
  } else if (state === 'corpse') {
    imgEl.src = corpseUrl;
  } else if (state === 'animated') {
    let step = 0;
    imgEl.src = animatedUrl;
    animInterval = setInterval(() => {
      step = (step + 1) % 2;
      imgEl.src = step === 0 ? animatedUrl : defaultUrl;
    }, 350);
  }
}

// Open drawer
function openCreatureDetailDrawer(c) {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }

  // Add layout class to shift grid to the left on wide screens
  document.getElementById('app-body-layout').classList.add('detail-open');

  const type = getCreatureType(c);
  const firstLetter = c.creature_id ? c.creature_id[0] : '?';
  
  const biomesListHtml = c.biomes.length > 0
    ? c.biomes.map(b => `<a href="${getBiomeWikiUrl(b)}" target="_blank" class="body-plan-arg-bubble hover-link" onmouseenter="updateBiomeInfo('${b}')" onmouseleave="resetBiomeInfo()" style="margin: 0.15rem 0.25rem 0.15rem 0; font-family: var(--font-sub); font-size:0.75rem; text-decoration: none; display: inline-block;">${formatBiomeName(b)} ↗</a>`).join('')
    : '<a href="https://dwarffortresswiki.org/index.php/Subterranean" target="_blank" class="body-plan-arg-bubble hover-link" onmouseenter="updateBiomeInfo(\'SUBTERRANEAN\')" onmouseleave="resetBiomeInfo()" style="text-decoration: none; display: inline-block;">Deep Caverns ↗</a>';
    
  const ageLabel = formatMaxAge(c.max_age);
  const size = getAdultSize(c.body_sizes);
  const sizeLabel = formatBodySize(size);
  const wPercentile = getWeightPercentile(size);
  const sPercentile = getSpeedPercentile(c.gait_speed);

  // Natural Attacks List HTML
  let attacksHtml = '<div style="color: var(--text-muted); font-style: italic;">No natural weapon forms parsed.</div>';
  if (c.resolved_attacks && c.resolved_attacks.length > 0) {
    attacksHtml = '<div class="drawer-attacks-list">';
    c.resolved_attacks.forEach(atk => {
      const typeBadgeClass = atk.attack_type === 'edged' ? 'attack-badge-edged' : 'attack-badge-blunt';
      attacksHtml += `
        <div class="attack-item-card">
          <div class="attack-header">
            <span class="attack-title">⚔ ${atk.name}</span>
            <div class="attack-badges">
              <span class="attack-badge ${typeBadgeClass}">${atk.attack_type}</span>
            </div>
          </div>
          <p class="attack-blurb">${getAttackBlurb(atk)}</p>
          <div class="attack-specs-grid">
            <div class="attack-spec-item">
              <span class="attack-spec-label">Part Source</span>
              <span class="attack-spec-val" style="text-transform: capitalize;">${atk.body_part_source.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
            <div class="attack-spec-item">
              <span class="attack-spec-label">Velocity Mult</span>
              <span class="attack-spec-val">${(atk.velocity_multiplier / 1000).toFixed(1)}x</span>
            </div>
            <div class="attack-spec-item">
              <span class="attack-spec-label">Contact Area</span>
              <span class="attack-spec-val">${Math.round(atk.contact_area_min)}</span>
            </div>
          </div>
        </div>
      `;
    });
    attacksHtml += '</div>';
  }

  // Body Detail Plans
  let bodyPlansHtml = '<div style="color: var(--text-muted); font-style: italic;">No structural body plans recorded.</div>';
  if (c.body_detail_plans && c.body_detail_plans.length > 0) {
    bodyPlansHtml = '<div class="drawer-body-plans">';
    c.body_detail_plans.forEach(plan => {
      let argsHtml = '';
      if (plan.arguments.length > 0) {
        argsHtml = '<div class="body-plan-args-flow">';
        plan.arguments.forEach((arg, i) => {
          const cleanArg = BODY_PLAN_LABELS[arg] || arg.toLowerCase();
          argsHtml += `<span class="body-plan-arg-bubble">${cleanArg}</span>`;
          if (i < plan.arguments.length - 1) {
            argsHtml += '<span class="body-plan-arrow">➔</span>';
          }
        });
        argsHtml += '</div>';
      } else {
        argsHtml = '<span class="body-plan-arg-bubble" style="font-style:italic; opacity: 0.6;">Standard composition template</span>';
      }
        
      bodyPlansHtml += `
        <div class="body-plan-card">
          <div class="body-plan-name">❖ ${getAnatomyLabel(plan.name)}</div>
          ${argsHtml}
        </div>
      `;
    });
    bodyPlansHtml += '</div>';
  }

  // 1. Spawning Frequency Text
  let freqText = 'Unique / Non-Spawning';
  if (c.spawn_frequency > 0) {
    if (c.spawn_frequency >= 80) freqText = `Common (${c.spawn_frequency})`;
    else if (c.spawn_frequency >= 40) freqText = `Uncommon (${c.spawn_frequency})`;
    else if (c.spawn_frequency >= 10) freqText = `Rare (${c.spawn_frequency})`;
    else freqText = `Ultra-Rare (${c.spawn_frequency})`;
  }
  
  // 2. Herd / Cluster Size
  let herdText = 'Solitary';
  if (c.cluster_min > 0) {
    if (c.cluster_min === c.cluster_max) {
      herdText = `${c.cluster_min} animal${c.cluster_min > 1 ? 's' : ''}`;
    } else {
      herdText = `${c.cluster_min} to ${c.cluster_max} animals${c.is_loose_cluster ? ' (Loose Cluster)' : ''}`;
    }
  }
  
  // 3. Population Density
  let popText = 'Varies';
  if (c.population_min > 0) {
    popText = `${c.population_min} to ${c.population_max} individuals`;
  }
  
  // 4. Activity Cycle Badge
  let cycleText = '🌗 Standard Day/Night';
  if (c.is_diurnal) cycleText = '☀️ Diurnal (Day-Active)';
  else if (c.is_nocturnal) cycleText = '🌙 Nocturnal (Night-Active)';
  else if (c.is_crepuscular) cycleText = '🌅 Crepuscular (Twilight-Active)';
  
  // 5. Swim Ability
  let swimText = 'Cannot Swim (Drown Hazard)';
  if (c.swimming_innate) swimText = 'Innate Swimmer (Water-adapted)';
  else if (c.swimming_learned) swimText = 'Can Learn to Swim';
  
  // 6. Body Temperature Text
  let tempText = 'Cold Bodied / Element';
  if (c.body_temperature !== undefined && c.body_temperature !== null) {
    tempText = `${c.body_temperature.toFixed(1)} °F`;
    if (c.body_temperature > 105) tempText += ' (High Heat)';
    else if (c.body_temperature < 95) tempText += ' (Cold Bodied)';
    else tempText += ' (Warm Blooded)';
  }

  // Biome Alignment
  let alignmentText = 'Neutral / Calm Lands';
  if (c.is_good) alignmentText = 'Good / Holy Biomes';
  else if (c.is_evil) alignmentText = 'Evil / Sinister Biomes';
  else if (c.is_savage) alignmentText = 'Savage / Untamed Wilds';

  // Special Attributes
  let extraAttributesText = 'Wild / Standard';
  let attrs = [];
  if (c.is_flier) attrs.push('Flying');
  if (c.is_trainable) attrs.push('Trainable (Hunting/War)');
  if (c.is_domestic) attrs.push('Domestic (Embarkable)');
  if (c.is_benign) attrs.push('Benign (Docile)');
  if (c.is_sentient) attrs.push('Sentient (Smart)');
  if (attrs.length > 0) {
    extraAttributesText = attrs.join(', ');
  }

  // 7. Thief Alert Warning Box
  let thiefAlertHtml = '';
  if (c.is_curious_eater || c.is_curious_item) {
    let thiefTypes = [];
    if (c.is_curious_eater) thiefTypes.push('Food/Crops');
    if (c.is_curious_item) thiefTypes.push('Fortress Items');
    thiefAlertHtml = `
      <div class="thief-warning-alert">
        <strong>Behavior Alert: Curious Thief Beast</strong><br>
        This creature will actively seek out and steal <strong>${thiefTypes.join(' and ')}</strong> from your stockpiles!
      </div>
    `;
  }

  // 8. Natural Skills list
  let skillsListHtml = '';
  if (c.skills && Object.keys(c.skills).length > 0) {
    skillsListHtml = '<div class="drawer-skills-list">';
    for (const [sname, rating] of Object.entries(c.skills)) {
      let ratingWord = 'Novice';
      if (rating >= 15) ratingWord = 'Master';
      else if (rating >= 10) ratingWord = 'Professional';
      else if (rating >= 5) ratingWord = 'Competent';
      
      skillsListHtml += `
        <div class="skill-item">
          <span class="skill-name">${sname.toLowerCase().replace(/_/g, ' ')}</span>
          <span class="skill-rating">${ratingWord} (Lvl ${rating})</span>
        </div>
      `;
    }
    skillsListHtml += '</div>';
  } else {
    skillsListHtml = '<div style="color:var(--text-muted); font-style:italic; font-size:0.85rem; padding: 0.5rem 0;">No specialized natural skills.</div>';
  }

  const displayPrice = c.pet_value && c.pet_value !== "None" ? `${c.pet_value} ★` : 'None';
  const priceClass = getPriceTierClass(c.pet_value);

  const combatTierInfo = getCombatTier(c.combat_rating);
  const economicTierInfo = getEconomicTier(c.economic_rating);

  const isAiGen = ['CENTAUR', 'CHIMERA', 'GRIFFON'].includes(c.creature_id);
  const aiLabelHtml = isAiGen 
    ? '<div class="drawer-ai-gen-label">⚠️ AI Generated Sprite (fanciful graphics not present in vanilla game files)</div>' 
    : '';

  let weightPercentileHtml = '';
  if (size > 0) {
    weightPercentileHtml = ` (<span class="stat-val-highlight">Heavier than ${wPercentile}% of creatures</span>)`;
  }

  let speedPercentileHtml = '';
  if (c.gait_speed !== null && c.gait_speed > 0) {
    speedPercentileHtml = ` (<span class="stat-val-highlight">Swifter than ${sPercentile}% of creatures</span>)`;
  }

  // Taxonomy Classify
  let taxonomyType = 'Mundane Wild Animal';
  if (c.is_megabeast) {
    taxonomyType = 'Savage Megabeast / Titan';
  } else if (c.is_semimegabeast) {
    taxonomyType = 'Wild Semimegabeast / Monster';
  } else if (c.is_sentient) {
    taxonomyType = 'Sentient / Sapient Creature';
  } else if (c.is_nopain || c.is_nobreathe || c.is_noexert) {
    taxonomyType = 'Construct / Non-Organic Life';
  } else if (c.is_domestic) {
    taxonomyType = 'Domesticated / Embark-Ready';
  } else if (c.is_trainable) {
    taxonomyType = 'Trainable Wild Beast';
  } else if (c.is_prehistoric || c.creature_classes.includes('REAL_WORLD_EXTINCT')) {
    taxonomyType = 'Prehistoric Ancient Life';
  } else if (c.is_flier) {
    taxonomyType = 'Flying Wild Beast';
  }

  // Drop-cap Description
  let descriptionHtml = '';
  if (c.description) {
    const desc = c.description.trim();
    const firstChar = desc[0];
    const restOfDesc = desc.substring(1);
    descriptionHtml = `
      <p class="drawer-field-note">
        <span class="drop-cap">${firstChar}</span>${restOfDesc}
      </p>
    `;
  } else {
    descriptionHtml = `<p class="drawer-field-note italic-note">No field journal records are cataloged for this creature.</p>`;
  }

  // Tabletop Stat Block
  const isHumanoid = c.is_sentient || c.is_animal_person || ['DWARF','ELF','HUMAN','GOBLIN','KOBOLD'].includes(c.creature_id);
  const dimensionsStr = estimateBodyDimensions(size, isHumanoid);

  const displayGait = c.gait_speed !== null ? `${c.gait_speed} delay` : 'N/A';
  const displayRating = c.combat_rating !== undefined ? `${c.combat_rating}/100` : 'Varies';
  const displayWeight = sizeLabel.split(' — ')[0];
  
  const tacticalStripHtml = `
    <div class="tactical-strip" style="grid-template-columns: repeat(4, 1fr);">
      <div class="tactical-cell">
        <span class="tactical-label">WEIGHT & SIZE</span>
        <span class="tactical-val">${displayWeight}</span>
        <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-tech); text-transform:uppercase; margin-top:0.15rem; text-align:center;">${dimensionsStr}</span>
      </div>
      <div class="tactical-cell">
        <span class="tactical-label">GAIT REFLEX</span>
        <span class="tactical-val">${displayGait}</span>
        <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-tech); text-transform:uppercase; margin-top:0.15rem; text-align:center;">${c.gait_speed !== null ? `Swiftness: Top ${100 - sPercentile}%` : 'No Land Speed'}</span>
      </div>
      <div class="tactical-cell">
        <span class="tactical-label">FORTRESS VALUE</span>
        <span class="tactical-val ${priceClass}">${displayPrice}</span>
        <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-tech); text-transform:uppercase; margin-top:0.15rem; text-align:center;">Market Demand</span>
      </div>
      <div class="tactical-cell">
        <span class="tactical-label">MARTIAL RANK</span>
        <span class="tactical-val">${displayRating}</span>
        <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-tech); text-transform:uppercase; margin-top:0.15rem; text-align:center;">Combat Rating</span>
      </div>
    </div>
  `;

  // Embark Status Box
  let embarkAlertHtml = '';
  if (c.included_in_mod) {
    embarkAlertHtml = `
      <div class="embark-status-alert status-allowed">
        <strong>Mod Embark Authorization: Approved</strong><br>
        Under this expansion mod, this creature is domesticated and can be purchased during your fortress embark planning phase (not available in the vanilla base game).
      </div>
    `;
  } else {
    let plainReason = 'This creature is incompatible with fortress embark husbandry under this mod.';
    const r = c.exclusion_reason || '';
    if (r.includes('ANIMAL_PERSON_ID') || r.includes('ANIMAL_PERSON_TAG')) {
      plainReason = '<strong>Sapient Citizen / Independent Mind (Mod Exclusion)</strong><br>This creature is an intelligent, civilized animal person. It cannot be domesticated, caged, or purchased as livestock.';
    } else if (r.includes('AQUATIC_LAND_DROWNER')) {
      plainReason = '<strong>Aquatic Suffocation Hazard (Mod Exclusion)</strong><br>This creature is strictly aquatic and has no land-breathing organs. It would suffocate and drown instantly on dry land upon embark.';
    } else if (r.includes('SAPIENT_DENYLIST')) {
      plainReason = '<strong>Sapient Fortress Race (Mod Exclusion)</strong><br>This is a member of the primary intelligent races (Dwarf, Elf, Human, Goblin, Kobold). They are citizens, not domesticable pets.';
    } else if (r.includes('TAG_EXCLUSION') && (c.is_megabeast || c.is_semimegabeast)) {
      plainReason = '<strong>Savage Mega-Beast / Hostile Monster (Mod Exclusion)</strong><br>This creature is a legendary beast or titan of destruction. It is permanently hostile to mortal civilization.';
    } else if (r.includes('BORDERLINE_DENYLIST')) {
      plainReason = '<strong>Exotic / Non-Domesticable Life (Mod Exclusion)</strong><br>This creature represents an exotic or dangerous species that refuses to be tamed by standard fortress trainers.';
    }
    embarkAlertHtml = `
      <div class="embark-status-alert status-denied">
        ${plainReason}
      </div>
    `;
  }

  drawerBody.innerHTML = `
    <div class="drawer-header">
      <div class="animator-view-container">
        <div class="animator-viewport">
          <img id="state-sprite-img" class="animator-sprite-render" src="data/images/states/${c.creature_id}_default.png" alt="" onerror="this.src='data/images/${c.creature_id}.png'; this.onerror=function(){ this.style.display='none'; this.nextElementSibling.style.display='block'; };">
          <span class="sprite-fallback" style="display:none; font-size:3rem; font-weight:bold; color:var(--text-accent);">${firstLetter}</span>
        </div>
        ${aiLabelHtml}
        <div class="animator-state-tabs">
          <button class="state-tab active" onclick="toggleAnimState('${c.creature_id}', 'default', this)">Stand</button>
          <button class="state-tab" id="tab-animated" style="${c.has_animated ? '' : 'display:none;'}" onclick="toggleAnimState('${c.creature_id}', 'animated', this)">Walk</button>
          <button class="state-tab" id="tab-child" style="${c.has_child ? '' : 'display:none;'}" onclick="toggleAnimState('${c.creature_id}', 'child', this)">Child</button>
          <button class="state-tab" id="tab-corpse" style="${c.has_corpse ? '' : 'display:none;'}" onclick="toggleAnimState('${c.creature_id}', 'corpse', this)">Corpse</button>
        </div>
      </div>
      
      <div class="drawer-title-block">
        <div class="drawer-taxonomy">${taxonomyType}</div>
        <span class="drawer-id">${c.creature_id}</span>
        <h2 class="drawer-name">${c.name || c.creature_id}</h2>
        <span class="drawer-source">Source File: <code>${formatSourceFile(c.source_file)}</code></span>
      </div>
    </div>

    <div class="drawer-section-title">❖ Ledger & Field Observations</div>
    ${descriptionHtml}
    ${thiefAlertHtml}
    ${embarkAlertHtml}

    ${tacticalStripHtml}

    <div class="drawer-grouped-grid">
      <!-- Panel 1: Spawning & Environment -->
      <div class="drawer-group-panel">
        <div class="panel-section-title">❖ Spawning & Environment</div>
        <div class="card-stats" style="border: none; padding: 0;">
          <div class="stat-row"><span class="stat-label">Spawning Status</span><span class="stat-val">${freqText}</span></div>
          <div class="stat-row"><span class="stat-label">Herd/Group Size</span><span class="stat-val">${herdText}</span></div>
          <div class="stat-row"><span class="stat-label">Regional Population</span><span class="stat-val">${popText}</span></div>
          <div class="stat-row"><span class="stat-label">Activity Cycle</span><span class="stat-val">${cycleText}</span></div>
          <div class="stat-row"><span class="stat-label">Body Temperature</span><span class="stat-val">${tempText}</span></div>
          <div class="stat-row"><span class="stat-label">Swimming Profile</span><span class="stat-val">${swimText}</span></div>
          <div class="stat-row"><span class="stat-label">Regional Alignment</span><span class="stat-val">${alignmentText}</span></div>
          <div class="stat-row"><span class="stat-label">Special Attributes</span><span class="stat-val">${extraAttributesText}</span></div>
          <div class="stat-row"><span class="stat-label">Expected Lifespan</span><span class="stat-val">${ageLabel}</span></div>
        </div>
        
        <div class="panel-section-title" style="margin-top: 1.5rem;">❖ Native Range Biomes</div>
        <div style="display:flex; flex-wrap:wrap; margin-top:0.4rem; margin-bottom: 0.6rem;">
          ${biomesListHtml}
        </div>
        <div id="biome-wiki-info-box" style="font-family: var(--font-body); font-style: italic; font-size: 0.85rem; color: var(--text-muted); line-height: 1.45; border-left: 2px solid var(--border-accent-dim); padding-left: 0.6rem; min-height: 2.5rem; transition: color 0.15s ease;">
          Hover over any biome badge to reveal details from the Dwarf Fortress Wiki.
        </div>
      </div>
      
      <!-- Panel 2: Combat & Skills -->
      <div class="drawer-group-panel">
        <div class="panel-section-title">❖ Martial & Tactical Assessment</div>
        <div class="drawer-rating-row" style="margin-bottom: 1.2rem;">
          <div class="drawer-rating-meta">
            <span style="color: #fc8181; font-weight: 600;">Combat Category: ${combatTierInfo.tier} (${combatTierInfo.name})</span>
          </div>
          <div class="drawer-rating-track">
            <div class="drawer-rating-fill" style="background: linear-gradient(90deg, #9b2c2c, #e53e3e); width: ${c.combat_rating || 0}%"></div>
          </div>
        </div>

        <div class="drawer-rating-row" style="margin-bottom: 1.2rem; margin-top: 1rem;">
          <div class="drawer-rating-meta">
            <span style="color: #63b3ed; font-weight: 600;">Gait Velocity (Land Speed): ${c.gait_speed !== null ? `${c.gait_speed} delay` : 'Stationary'}</span>
            <span style="color: #63b3ed; font-size: 0.85rem; font-family: var(--font-tech);">${c.gait_speed !== null ? `Swifter than ${sPercentile}%` : ''}</span>
          </div>
          <div class="drawer-rating-track" style="border-color: rgba(99, 179, 237, 0.25);">
            <div class="drawer-rating-fill" style="background: linear-gradient(90deg, #2b6cb0, #3182ce); width: ${sPercentile}%"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted); font-family:var(--font-tech); margin-top:0.2rem;">
            <span>Slow (8775 delay)</span>
            <span>Fast (100 delay)</span>
          </div>
        </div>

        <div class="panel-section-title">❖ Natural Weaponry</div>
        ${attacksHtml}

        <div class="panel-section-title" style="margin-top: 1.5rem;">❖ Specialized Natural Skills</div>
        ${skillsListHtml}
      </div>
    </div>

    <div class="drawer-section-title" style="margin-bottom: 0.5rem; margin-top: 2rem;">❖ Anatomical Tissue Structure</div>
    ${bodyPlansHtml}
  `;

  detailDrawer.classList.add('active');
  
  // Only lock scroll on smaller screens where drawer is an overlay modal
  if (window.innerWidth < 1400) {
    document.body.style.overflow = 'hidden';
  }
}

function closeCreatureDrawer() {
  if (animInterval) {
    clearInterval(animInterval);
    animInterval = null;
  }
  detailDrawer.classList.remove('active');
  document.getElementById('app-body-layout').classList.remove('detail-open');
  document.body.style.overflow = '';
}

// DOM Elements
const totalParsedEl = document.getElementById('total-parsed');
const totalIncludedEl = document.getElementById('total-included');
const totalExcludedEl = document.getElementById('total-excluded');
const searchBox = document.getElementById('search-box');
const filterInclusion = document.getElementById('filter-inclusion');
const filterEra = document.getElementById('filter-era');
const filterEnvironment = document.getElementById('filter-environment');
const filterAlignment = document.getElementById('filter-alignment');
const filterCapabilities = document.getElementById('filter-capabilities');
const filterRarity = document.getElementById('filter-rarity');
const filterSentience = document.getElementById('filter-sentience');
const sortBy = document.getElementById('sort-by');
const cardsContainer = document.getElementById('cards-container');
const detailDrawer = document.getElementById('detail-drawer');
const closeDrawer = document.getElementById('close-drawer');
const drawerBody = document.getElementById('drawer-body');

// Load stats from metadata
if (typeof CREATURES_DATA !== 'undefined') {
  preprocessData(CREATURES_DATA.creatures);
  
  const meta = CREATURES_DATA.metadata;
  totalParsedEl.textContent = meta.total_creatures;
  totalIncludedEl.textContent = meta.included_count;
  totalExcludedEl.textContent = meta.excluded_count;
  
  renderCreatures(CREATURES_DATA.creatures);
} else {
  cardsContainer.innerHTML = `
    <div class="no-results">
      <h3>Archive Data File Not Found</h3>
      <p>Could not locate the database files. Verify that <code>data/creatures_data.js</code> has been compiled.</p>
    </div>
  `;
}

// Event Listeners
searchBox.addEventListener('input', applyFilters);
filterInclusion.addEventListener('change', applyFilters);
filterEra.addEventListener('change', applyFilters);
filterEnvironment.addEventListener('change', applyFilters);
filterAlignment.addEventListener('change', applyFilters);
filterCapabilities.addEventListener('change', applyFilters);
filterRarity.addEventListener('change', applyFilters);
filterSentience.addEventListener('change', applyFilters);
sortBy.addEventListener('change', applyFilters);

closeDrawer.addEventListener('click', closeCreatureDrawer);
detailDrawer.addEventListener('click', (e) => {
  if (e.target === detailDrawer) closeCreatureDrawer();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCreatureDrawer();
});

// Filter and Sort Handler
function applyFilters() {
  if (typeof CREATURES_DATA === 'undefined') return;

  let list = [...CREATURES_DATA.creatures];

  const searchVal = searchBox.value.toLowerCase().trim();
  if (searchVal) {
    list = list.filter(c => {
      const idMatch = c.creature_id.toLowerCase().includes(searchVal);
      const nameMatch = c.name && c.name.toLowerCase().includes(searchVal);
      const descMatch = c.description && c.description.toLowerCase().includes(searchVal);
      
      const biomeMatch = c.biomes.some(b => 
        b.toLowerCase().includes(searchVal) || 
        formatBiomeName(b).toLowerCase().includes(searchVal)
      );
      
      const attackMatch = c.resolved_attacks && c.resolved_attacks.some(atk => 
        atk.name.toLowerCase().includes(searchVal) || atk.attack_type.toLowerCase().includes(searchVal)
      );
      
      const planMatch = c.body_detail_plans && c.body_detail_plans.some(plan =>
        plan.name.toLowerCase().includes(searchVal) || 
        getAnatomyLabel(plan.name).toLowerCase().includes(searchVal) ||
        plan.arguments.some(arg => arg.toLowerCase().includes(searchVal) || (BODY_PLAN_LABELS[arg] && BODY_PLAN_LABELS[arg].toLowerCase().includes(searchVal)))
      );

      const searchTags = [];
      if (c.is_webber) searchTags.push('web', 'silk', 'spider', 'webbing');
      if (c.lays_eggs) searchTags.push('egg', 'clutch', 'egg layer');
      if (c.milkable) searchTags.push('milk', 'milkable');
      if (c.shearable) searchTags.push('shear', 'wool', 'fur', 'hair');
      if (c.is_mount) searchTags.push('mount', 'ride');
      if (c.is_pack) searchTags.push('pack', 'cargo');
      if (c.is_wagon) searchTags.push('wagon', 'pull');
      if (c.is_nopain) searchTags.push('nopain', 'painless');
      if (c.is_noexert) searchTags.push('noexert', 'tireless');
      if (c.is_nobreathe) searchTags.push('nobreathe', 'airless', 'drown proof');
      if (c.is_trapavoid) searchTags.push('trapavoid', 'trap');
      
      if (c.is_aquatic) searchTags.push('aquatic', 'water', 'sea');
      if (c.is_amphibious) searchTags.push('amphibious', 'land water');
      if (c.is_prehistoric) searchTags.push('prehistoric', 'dinosaur', 'extinct');

      // Alignment and Spawning Capabilities
      if (c.is_good) searchTags.push('good', 'holy', 'good-aligned', 'angel');
      if (c.is_evil) searchTags.push('evil', 'sinister', 'evil-aligned', 'devil');
      if (c.is_savage) searchTags.push('savage', 'untamed', 'savage-aligned', 'wilds');
      if (c.is_flier) searchTags.push('flier', 'fly', 'flying', 'wings');
      if (c.is_trainable) searchTags.push('trainable', 'hunting', 'war');
      if (c.is_domestic) searchTags.push('domestic', 'embark', 'pet');
      if (c.is_benign) searchTags.push('benign', 'docile', 'peaceful');
      if (c.is_sentient) searchTags.push('sentient', 'smart', 'intelligent', 'sapient', 'can speak', 'can learn', 'brain');

      // Extended Tag Search Keywords
      if (c.is_diurnal) searchTags.push('diurnal', 'day', 'day-active');
      if (c.is_nocturnal) searchTags.push('nocturnal', 'night', 'night-active');
      if (c.is_crepuscular) searchTags.push('crepuscular', 'twilight', 'dawn', 'dusk', 'twilight-active');
      
      if (c.is_curious_eater) searchTags.push('curious eater', 'food thief', 'thief', 'thief beast', 'steal food');
      if (c.is_curious_item) searchTags.push('curious item', 'item thief', 'thief', 'thief beast', 'steal item');
      if (c.is_curious_eater || c.is_curious_item) searchTags.push('thief', 'thief beast', 'steals');
      
      if (c.swimming_innate) searchTags.push('innate swimmer', 'swim', 'swimmer', 'water');
      if (c.swimming_learned) searchTags.push('learn to swim', 'swim', 'swimmer');
      if (!c.swimming_innate && !c.swimming_learned) searchTags.push('drown hazard', 'cannot swim');
      
      if (c.max_age === "None" || !c.max_age) searchTags.push('immortal', 'ageless', 'infinite lifespan');
      
      if (c.skills) {
        Object.keys(c.skills).forEach(s => {
          searchTags.push(s.toLowerCase(), s.toLowerCase().replace(/_/g, ' '));
        });
      }
      
      const tagMatch = searchTags.some(t => t.toLowerCase().includes(searchVal));
      
      return idMatch || nameMatch || descMatch || biomeMatch || tagMatch || attackMatch || planMatch;
    });
  }

  // Mod Inclusion
  const incVal = filterInclusion.value;
  if (incVal === 'included') {
    list = list.filter(c => c.included_in_mod);
  } else if (incVal === 'excluded') {
    list = list.filter(c => !c.included_in_mod);
  }

  // Era
  const eraVal = filterEra.value;
  if (eraVal === 'prehistoric') {
    list = list.filter(c => c.is_prehistoric || c.creature_classes.includes('REAL_WORLD_EXTINCT'));
  } else if (eraVal === 'cavern') {
    list = list.filter(c => 
      c.source_file.includes('subterranean') || 
      c.biomes.some(b => b.includes('SUBTERRANEAN'))
    );
  } else if (eraVal === 'surface') {
    list = list.filter(c => 
      !c.is_prehistoric && 
      !c.creature_classes.includes('REAL_WORLD_EXTINCT') &&
      !c.source_file.includes('subterranean') &&
      !c.biomes.some(b => b.includes('SUBTERRANEAN'))
    );
  }

  // Environment
  const envVal = filterEnvironment.value;
  if (envVal === 'aquatic') {
    list = list.filter(c => c.is_aquatic && !c.is_amphibious);
  } else if (envVal === 'amphibious') {
    list = list.filter(c => c.is_amphibious);
  } else if (envVal === 'land') {
    list = list.filter(c => !c.is_aquatic);
  }

  // Alignment
  const alignVal = filterAlignment.value;
  if (alignVal === 'good') {
    list = list.filter(c => c.is_good);
  } else if (alignVal === 'evil') {
    list = list.filter(c => c.is_evil);
  } else if (alignVal === 'savage') {
    list = list.filter(c => c.is_savage);
  } else if (alignVal === 'neutral') {
    list = list.filter(c => !c.is_good && !c.is_evil && !c.is_savage);
  }

  // Special Attributes
  const capVal = filterCapabilities.value;
  if (capVal === 'flier') {
    list = list.filter(c => c.is_flier);
  } else if (capVal === 'trainable') {
    list = list.filter(c => c.is_trainable);
  } else if (capVal === 'domestic') {
    list = list.filter(c => c.is_domestic);
  }

  // Sentience / Smart
  const sentienceVal = filterSentience.value;
  if (sentienceVal === 'sentient') {
    list = list.filter(c => c.is_sentient);
  } else if (sentienceVal === 'wild') {
    list = list.filter(c => !c.is_sentient);
  }

  // Wilderness Rarity
  const rarityVal = filterRarity.value;
  if (rarityVal === 'common') {
    list = list.filter(c => c.spawn_frequency >= 80);
  } else if (rarityVal === 'uncommon') {
    list = list.filter(c => c.spawn_frequency >= 40 && c.spawn_frequency < 80);
  } else if (rarityVal === 'rare') {
    list = list.filter(c => c.spawn_frequency >= 10 && c.spawn_frequency < 40);
  } else if (rarityVal === 'ultrarare') {
    list = list.filter(c => c.spawn_frequency > 0 && c.spawn_frequency < 10);
  } else if (rarityVal === 'unique') {
    list = list.filter(c => c.spawn_frequency <= 0 || c.spawn_frequency === undefined || c.spawn_frequency === null);
  }

  // Sorting
  const sortVal = sortBy.value;
  list.sort((a, b) => {
    if (sortVal === 'name-asc') {
      return (a.name || a.creature_id).localeCompare(b.name || b.creature_id);
    } else if (sortVal === 'name-desc') {
      return (b.name || b.creature_id).localeCompare(a.name || a.creature_id);
    } else if (sortVal === 'combat-desc') {
      return (b.combat_rating || 0) - (a.combat_rating || 0);
    } else if (sortVal === 'economic-desc') {
      return (b.economic_rating || 0) - (a.economic_rating || 0);
    } else if (sortVal === 'petvalue-desc') {
      return (parseInt(b.pet_value) || 0) - (parseInt(a.pet_value) || 0);
    } else if (sortVal === 'petvalue-asc') {
      const valA = a.pet_value === "" || a.pet_value === "None" ? 99999 : parseInt(a.pet_value) || 0;
      const valB = b.pet_value === "" || b.pet_value === "None" ? 99999 : parseInt(b.pet_value) || 0;
      return valA - valB;
    } else if (sortVal === 'size-desc') {
      return getAdultSize(b.body_sizes) - getAdultSize(a.body_sizes);
    } else if (sortVal === 'size-asc') {
      const sizeA = getAdultSize(a.body_sizes) || 999999999;
      const sizeB = getAdultSize(b.body_sizes) || 999999999;
      return sizeA - sizeB;
    } else if (sortVal === 'maxage-desc') {
      const ageA = a.max_age === "None" || !a.max_age ? 99999 : getMaxAge(a.max_age);
      const ageB = b.max_age === "None" || !b.max_age ? 99999 : getMaxAge(b.max_age);
      return ageB - ageA;
    } else if (sortVal === 'maxage-asc') {
      const ageA = a.max_age === "None" || !a.max_age ? 99999 : getMaxAge(a.max_age);
      const ageB = b.max_age === "None" || !b.max_age ? 99999 : getMaxAge(b.max_age);
      return ageA - ageB;
    } else if (sortVal === 'speed-asc') {
      const speedA = a.gait_speed === null || a.gait_speed <= 0 ? 999999 : a.gait_speed;
      const speedB = b.gait_speed === null || b.gait_speed <= 0 ? 999999 : b.gait_speed;
      return speedA - speedB;
    } else if (sortVal === 'speed-desc') {
      const speedA = a.gait_speed === null || a.gait_speed <= 0 ? 999999 : a.gait_speed;
      const speedB = b.gait_speed === null || b.gait_speed <= 0 ? 999999 : b.gait_speed;
      return speedB - speedA;
    }
    return 0;
  });

  renderCreatures(list);
}

// Helper for max age sorting
function getMaxAge(maxAgeStr) {
  if (!maxAgeStr || maxAgeStr === "None") return 9999;
  const match = maxAgeStr.match(/MAXAGE:(\d+):(\d+)/);
  return match ? parseInt(match[2]) : 0;
}

// Renderer function
function renderCreatures(list) {
  cardsContainer.innerHTML = '';
  
  if (list.length === 0) {
    cardsContainer.innerHTML = `
      <div class="no-results">
        <h3>No Beasts Found</h3>
        <p>No creature records match the current filters. Adjust your search criteria.</p>
      </div>
    `;
    return;
  }

  list.forEach((c, index) => {
    const card = document.createElement('div');
    const size = getAdultSize(c.body_sizes);
    let natureClasses = ['card'];
    if (c.is_megabeast || c.is_semimegabeast || size >= 5000000) {
      natureClasses.push('nature-megabeast');
    }
    if (c.is_sentient) {
      natureClasses.push('nature-sentient');
    }
    if (c.is_flier) {
      natureClasses.push('nature-flyer');
    }
    if (c.is_aquatic || c.is_amphibious) {
      natureClasses.push('nature-aquatic');
    }
    if (c.is_nopain || c.is_nobreathe || c.is_noexert) {
      natureClasses.push('nature-construct');
    }
    if (c.is_domestic || c.is_trainable) {
      natureClasses.push('nature-domestic');
    }
    if (!c.is_sentient && !c.is_megabeast && !c.is_flier && !c.is_aquatic && !c.is_nopain) {
      natureClasses.push('nature-wild');
    }
    card.className = natureClasses.join(' ');
    card.style.animationDelay = `${Math.min(20, index) * 0.03}s`;
    
    const type = getCreatureType(c);
    const firstLetter = c.creature_id ? c.creature_id[0] : '?';
    
    card.addEventListener('click', () => openCreatureDetailDrawer(c));
    
    let badgesHtml = '';
    if (c.included_in_mod) {
      badgesHtml += `<span class="badge badge-included">Included</span>`;
    } else {
      badgesHtml += `<span class="badge badge-excluded">Excluded</span>`;
    }
    
    if (c.is_aquatic && !c.is_amphibious) {
      badgesHtml += `<span class="badge badge-type badge-aquatic">Aquatic</span>`;
    } else if (c.is_amphibious) {
      badgesHtml += `<span class="badge badge-type badge-amphibious">Amphibious</span>`;
    } else if (c.is_prehistoric || c.creature_classes.includes('REAL_WORLD_EXTINCT')) {
      badgesHtml += `<span class="badge badge-type badge-prehistoric">Prehistoric</span>`;
    } else if (c.source_file.includes('subterranean') || c.biomes.some(b => b.includes('SUBTERRANEAN'))) {
      badgesHtml += `<span class="badge badge-type badge-cavern">Cavern</span>`;
    }

    if (c.is_good) badgesHtml += `<span class="badge badge-type badge-good">Good</span>`;
    if (c.is_evil) badgesHtml += `<span class="badge badge-type badge-evil">Evil</span>`;
    if (c.is_savage) badgesHtml += `<span class="badge badge-type badge-savage">Savage</span>`;
    if (c.is_flier) badgesHtml += `<span class="badge badge-type badge-flier">Flyer</span>`;
    if (c.is_sentient) badgesHtml += `<span class="badge badge-type badge-sentient">Sentient</span>`;

    if (c.is_webber) badgesHtml += `<span class="badge badge-trait">❖ Web</span>`;
    if (c.is_nopain) badgesHtml += `<span class="badge badge-trait">❖ Painless</span>`;
    if (c.is_noexert) badgesHtml += `<span class="badge badge-trait">❖ Tireless</span>`;
    if (c.is_nobreathe) badgesHtml += `<span class="badge badge-trait">❖ Airless</span>`;
    if (c.is_trapavoid) badgesHtml += `<span class="badge badge-trait">❖ TrapAvoid</span>`;
    if (c.lays_eggs) badgesHtml += `<span class="badge badge-trait">❖ Eggs</span>`;
    if (c.is_mount) badgesHtml += `<span class="badge badge-trait">❖ Mount</span>`;
    
    const sizeLabel = formatBodySize(size).split(' — ')[0];

    let ageStr = formatMaxAge(c.max_age);
    if (ageStr.includes(' years')) ageStr = ageStr.replace(' years', ' yrs');

    const biomesStr = c.biomes.length > 0 
      ? c.biomes.slice(0, 2).map(b => formatBiomeName(b)).join(', ') + (c.biomes.length > 2 ? '...' : '')
      : 'Subterranean Caverns';

    const priceTierClass = getPriceTierClass(c.pet_value);
    const displayPrice = c.pet_value && c.pet_value !== "None" ? `${c.pet_value} ★` : 'None';

    const wPercentile = getWeightPercentile(size);
    const sPercentile = getSpeedPercentile(c.gait_speed);
    
    const combatTierInfo = getCombatTier(c.combat_rating);
    const economicTierInfo = getEconomicTier(c.economic_rating);

    let attacksBadgeHtml = '';
    if (c.resolved_attacks && c.resolved_attacks.length > 0) {
      attacksBadgeHtml = '<div class="card-attack-types-list">';
      c.resolved_attacks.forEach(atk => {
        const typeClass = atk.attack_type === 'edged' ? 'atk-type-edged' : 'atk-type-blunt';
        attacksBadgeHtml += `<span class="card-attack-badge ${typeClass}">${atk.name.toLowerCase()} (${atk.attack_type})</span>`;
      });
      attacksBadgeHtml += '</div>';
    } else {
      attacksBadgeHtml = '<div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; margin-top: 0.3rem;">No natural weaponry</div>';
    }

    let speedHtml = '';
    if (c.gait_speed !== null && c.gait_speed > 0) {
      const speedPct = getSpeedPercent(c.gait_speed);
      speedHtml = `
        <div class="speed-scale-container" title="Gait Delay: ${c.gait_speed} (Lower delay is faster)">
          <div class="speed-scale-labels">
            <span>Swift (100)</span>
            <span class="speed-current">${c.gait_speed} delay</span>
            <span>Slow (2000+)</span>
          </div>
          <div class="speed-scale-track">
            <div class="speed-scale-marker" style="left: ${speedPct}%"></div>
          </div>
        </div>
      `;
    } else {
      speedHtml = `
        <div class="speed-scale-container speed-disabled">
          <div class="speed-scale-labels">
            <span>Swift (100)</span>
            <span class="speed-current">No land speed</span>
            <span>Slow (2000+)</span>
          </div>
          <div class="speed-scale-track"></div>
        </div>
      `;
    }

    const isAiGen = ['CENTAUR', 'CHIMERA', 'GRIFFON'].includes(c.creature_id);
    const aiGenBadge = isAiGen ? `<div class="ai-gen-badge">AI Gen</div>` : '';

    card.innerHTML = `
      <div class="card-top-split">
        <div class="card-left-col">
          <div class="sprite-slot type-${type}">
            <img class="sprite-img" src="data/images/${c.creature_id}.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span class="sprite-fallback" style="display:none;">${firstLetter}</span>
            ${aiGenBadge}
          </div>
          <div class="card-ratings">
            <div class="rating-bar-container">
              <div class="rating-label">
                <span>⚔ CBT: ${combatTierInfo.tier}</span>
                <span>${c.combat_rating || 0}</span>
              </div>
              <div class="rating-track">
                <div class="rating-fill combat-fill" style="width: ${c.combat_rating || 0}%"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-right-col">
          <div class="card-title-block">
            <div class="card-id">${c.creature_id}</div>
            <h3 class="card-name" title="${c.name || c.creature_id}">${c.name || c.creature_id}</h3>
          </div>
          <p class="card-desc" title="${c.description || 'No description raw file.'}">${c.description || 'No description raw file.'}</p>
          <div class="card-badges">
            ${badgesHtml}
          </div>
          ${attacksBadgeHtml}
        </div>
      </div>
      <div>
        <div class="card-stats">
          <div class="stat-row">
            <span class="stat-label">Mass / Weight</span>
            <span class="stat-val" title="${formatBodySize(size)}">${sizeLabel} (<span class="stat-val-highlight">Top ${100 - wPercentile}%</span>)</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Land Speed</span>
            <span class="stat-val">${c.gait_speed !== null ? c.gait_speed : 'N/A'} (<span class="stat-val-highlight">Top ${100 - sPercentile}%</span>)</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Pet Value</span>
            <span class="stat-val ${priceTierClass}">${displayPrice}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Expected Age</span>
            <span class="stat-val" title="${formatMaxAge(c.max_age)}">${ageStr}</span>
          </div>
        </div>
        ${speedHtml}
        <div class="card-biomes" title="${c.biomes.map(b => formatBiomeName(b)).join(', ')}">
          Biomes: ${biomesStr}
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}
