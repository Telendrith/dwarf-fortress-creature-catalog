# Changelog

All notable changes to the "Ultimate Embark Animals" mod will be documented in this file.

## [0.6] - 2026-06-28
### Added / Changed
- **Autistike's Migrant Pet Fix:** Swapped `[PET]` for `[PET_EXOTIC]` across modded creatures and simplified the dwarven civilization entity roster to use general permission tags (`[USE_GOOD_ANIMALS]`, `[USE_EVIL_ANIMALS]`, `[USE_CAVE_ANIMALS]`). I think the reason migrants were clogging forts with giant tortoises and cobras was because the total domestic pet pool grew to 409, so migrants had a 97.5% chance to roll an exotic pet. Flagging them as `[PET_EXOTIC]` lets you buy them at embark but prevents migrants from spawning with them.
- **Respect Worldgen Extinction settings:** Removed the static `[COMMON_DOMESTIC]` override from prehistoric creatures. They will now only appear at embark if "Real world extinct creatures" is set to "Domesticated", and will remain wild or extinct otherwise, respecting worldgen.
- **Vanilla Domestics Preservation:** Excluded vanilla domestic creatures (such as Dogs, Cats, Pigs, Cows) from being overridden, ensuring cats and dogs remain normal pets for migrants and livestock stays livestock.

## [0.5] - 2026-06-27
### Added
- **Pokedex Sentience Fix:** Fixed a database compiler bug that miscalculated intelligence flags for animal people. They are now correctly parsed and listed as sentient.
- **Card Classification Fix:** Corrected Web UI classification logic to ensure trainable excluded wild beasts (like dinosaurs or aquatic predators) are not incorrectly labeled as "Domestic".
- **Enhanced Repository Documentation:** Redesigned the main README with GitHub status badges, screenshots gallery, and link integrations.
- **Mod Page Links Integration:** Updated the Steam description template to directly link to the GitHub project source and the live Creature Catalog website.

## [0.4] - 2026-06-27
### Added
- **Categorized and Value-Sorted Embark Screen Layout:** Reordered animal overrides inside raw files. Animals are now grouped into three distinct categories (Mundane wild fauna first, Cavern beasts second, and Prehistoric beasts third) and sorted in ascending order of their Pet Value within each group, resolving embark scroll usability issues.
- **Entity Override Syntax Cleanups:** Fixed an unrecognized civilization tag in the Mountain entity override file, correcting loading warnings in the game's logs.

## [0.3] - 2026-06-27
### Added
- **Civilization Entity Overrides:** Added dwarven civilization entity permissions to allow Cave Dragons, Ice Wolves, and other alignment/exotic beasts to populate the embark selection screen.
- **Yeti and Sasquatch Spawning:** Stripped the mythical spawning lock from Yetis and Sasquatches, converting them into spawnable wild fauna in cold climates (mountain, glacier, tundra) while retaining embark availability.
- **Logical Marine Land Survival Check:** Audited prehistoric aquatic species:
  - Appended land-walking properties to 5 beach-dwelling/air-breathing species (Archelon, sea scorpions, and placodonts) so they survive embarking on dry land.
  - Left strictly aquatic prehistoric fish and pelagic reptiles to suffocate on dry land.
- **Cave Dragon Price Re-balance:** Reduced the Cave Dragon base cost from 10,000 to 1,000 embark points to make embarking with them gameplay-viable.
- **Unvalued Creatures Pricing Fix:** Calculated and assigned default starting values based on combat ratings for the 10 animals lacking vanilla values (Yeti, Sasquatch, Fire Imp, Grimeling, etc.), preventing them from being free.
- **Exclusion Filters Refinement:** Excluded equipment wagons and legend-only chimeras, centaurs, and griffons from mod domestication.
- **Web Companion UI Logs:** Added logs inside the Web UI bestiary companion pages showing custom price, Fanciful, and amphibious overrides.

## [0.2] - 2026-06-25
### Added
- **Prehistoric Marine Life Integration:** Added extinct prehistoric marine life (Helicoprion, Mosasaurus, Ammonite, Trilobite, etc.) to the embark screen.
- **Cavern Dweller Exclusions:** Excluded borderline sapient-adjacent cavern creatures (Trolls, Gremlins, Troglodytes) from the embark list.
- **Offline & Online Web Bestiary Companion:** Launched the Web Bestiary companion pages for browsing animal stats and mod statuses.

## [0.1] - 2026-06-25
### Added
- Initial Release!
- Added `[COMMON_DOMESTIC]`, `[TRAINABLE]`, and `[PET]` tags to native vanilla creatures.
- Filtered out Megabeasts, Semi-Megabeasts, Night Creatures, and Animal People to maintain embark balance.
