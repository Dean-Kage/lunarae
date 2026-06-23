import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ClassificationReviewModal from "../components/review/ClassificationReviewModal.jsx";

/* ═══════════════════════════════════════════════════════════════════
   ZIMBABWE HS CODE + CBCA/LICENCE KNOWLEDGE BASE
   Trained from the EDA HOME invoice reference document
   ═══════════════════════════════════════════════════════════════════ */

// CBCA = Cross Border Currency Act (SI 35/2024) — required for goods in
// 4th Schedule when FOB > USD 1,000 per consignment, or ALWAYS for certain
// categories regardless of value when marked with CBCA ALWAYS flag.
// Import Licence = required per SI 122/2017 for specific controlled goods.

const HS_KNOWLEDGE = {
  // ── Chapter 18 ─────────────────────────────────────────────────
  "18069010": { cbca: true, licence: false, duty: 0.40, desc: "Chocolate products" },
  // ── Chapter 30 ─────────────────────────────────────────────────
  "30051000": { cbca: true, licence: false, duty: 0.25, desc: "Adhesive dressings/medical" },
  // ── Chapter 32 ─────────────────────────────────────────────────
  "32091010": { cbca: true, licence: false, duty: 0.40, desc: "Paints/varnishes water-based" },
  // ── Chapter 33 ─────────────────────────────────────────────────
  "33011900": { cbca: true, licence: false, duty: 0.25, desc: "Essential oils" },
  "33019090": { cbca: true, licence: false, duty: 0.25, desc: "Concentrates/resinoids" },
  "33030000": { cbca: true, licence: false, duty: 0.40, desc: "Perfumes/toilet waters" },
  "33042000": { cbca: true, licence: false, duty: 0.40, desc: "Eye make-up preparations" },
  "33043000": { cbca: true, licence: false, duty: 0.40, desc: "Manicure/pedicure preparations" },
  "33049100": { cbca: true, licence: false, duty: 0.40, desc: "Powders for beauty/make-up" },
  "33049900": { cbca: true, licence: false, duty: 0.40, desc: "Beauty/make-up preparations" },
  "33049990": { cbca: true, licence: false, duty: 0.40, desc: "Cosmetics/skin care preparations" },
  "33059000": { cbca: true, licence: false, duty: 0.40, desc: "Hair preparations n.e.s." },
  "33071000": { cbca: true, licence: false, duty: 0.40, desc: "Pre-shave/shaving preparations" },
  "33074900": { cbca: true, licence: false, duty: 0.40, desc: "Room/car deodorisers/perfumes" },
  // ── Chapter 34 ─────────────────────────────────────────────────
  "34022000": { cbca: true, licence: true,  duty: 0.40, desc: "Surface-active preparations/detergents" },
  "34040000": { cbca: true, licence: false, duty: 0.25, desc: "Artificial waxes" },
  "34059000": { cbca: true, licence: false, duty: 0.40, desc: "Polishes/creams for glass" },
  "34060000": { cbca: true, licence: false, duty: 0.40, desc: "Candles/tapers" },
  // ── Chapter 38 ─────────────────────────────────────────────────
  "38029000": { cbca: true, licence: false, duty: 0.25, desc: "Activated natural mineral products" },
  "38089190": { cbca: true, licence: false, duty: 0.40, desc: "Insecticides/repellents" },
  "38229000": { cbca: true, licence: false, duty: 0.25, desc: "Diagnostic/lab reagents" },
  // ── Chapter 39 ─────────────────────────────────────────────────
  "39173290": { cbca: true, licence: false, duty: 0.25, desc: "Plastic pipes/tubing" },
  "39199090": { cbca: true, licence: false, duty: 0.40, desc: "Self-adhesive plates/tape of plastics" },
  "39206200": { cbca: true, licence: false, duty: 0.40, desc: "Polyethylene terephthalate film" },
  "39221000": { cbca: true, licence: false, duty: 0.40, desc: "Baths/showers of plastics" },
  "39222000": { cbca: true, licence: false, duty: 0.40, desc: "Lavatory seats/covers of plastics" },
  "39241090": { cbca: true, licence: false, duty: 0.40, desc: "Tableware/kitchenware of plastics" },
  "39249090": { cbca: true, licence: false, duty: 0.40, desc: "Household articles of plastics" },
  "39259000": { cbca: true, licence: false, duty: 0.40, desc: "Builders' ware of plastics n.e.s." },
  "39261000": { cbca: true, licence: false, duty: 0.40, desc: "Office/school supplies of plastics" },
  "39262010": { cbca: true, licence: false, duty: 0.40, desc: "Gloves of plastics" },
  "39269090": { cbca: true, licence: false, duty: 0.40, desc: "Other articles of plastics" },
  // ── Chapter 40 ─────────────────────────────────────────────────
  "40091100": { cbca: true, licence: false, duty: 0.25, desc: "Rubber tubes/pipes without fittings" },
  "40169900": { cbca: true, licence: false, duty: 0.40, desc: "Other articles of vulcanised rubber" },
  // ── Chapter 42 ─────────────────────────────────────────────────
  "42021990": { cbca: true, licence: false, duty: 0.40, desc: "Trunks/suitcases/bags" },
  "42022900": { cbca: true, licence: false, duty: 0.40, desc: "Handbags/purses" },
  "42033000": { cbca: true, licence: false, duty: 0.40, desc: "Belts of leather" },
  "42050000": { cbca: true, licence: false, duty: 0.40, desc: "Other articles of leather" },
  // ── Chapter 44 ─────────────────────────────────────────────────
  "44149000": { cbca: true, licence: false, duty: 0.40, desc: "Wooden frames for pictures/mirrors" },
  "44152000": { cbca: true, licence: false, duty: 0.40, desc: "Wooden pallets/box-pallets" },
  "44160000": { cbca: true, licence: false, duty: 0.40, desc: "Casks/barrels/tubs of wood" },
  "44209091": { cbca: true, licence: false, duty: 0.40, desc: "Wooden caskets/jewellery boxes" },
  "44219090": { cbca: true, licence: false, duty: 0.40, desc: "Other articles of wood" },
  // ── Chapter 46 ─────────────────────────────────────────────────
  "46021900": { cbca: true, licence: false, duty: 0.40, desc: "Basketwork/wickerwork" },
  // ── Chapter 48 ─────────────────────────────────────────────────
  "48114000": { cbca: true, licence: false, duty: 0.25, desc: "Gummed/adhesive paper" },
  "48114100": { cbca: true, licence: false, duty: 0.25, desc: "Self-adhesive paper" },
  "48114900": { cbca: true, licence: false, duty: 0.25, desc: "Other gummed paper" },
  "48191000": { cbca: true, licence: false, duty: 0.25, desc: "Cartons/boxes of paper" },
  "48196000": { cbca: true, licence: false, duty: 0.25, desc: "Box files/document holders" },
  "48201000": { cbca: true, licence: false, duty: 0.25, desc: "Registers/account books/notebooks" },
  // ── Chapter 52/54/56 ───────────────────────────────────────────
  "52010091": { cbca: true, licence: false, duty: 0.00, desc: "Cotton, not carded or combed" },
  "54076900": { cbca: true, licence: false, duty: 0.40, desc: "Woven fabrics of synthetic filament yarn" },
  "56012100": { cbca: true, licence: false, duty: 0.40, desc: "Wadding/articles of cotton" },
  "56075000": { cbca: true, licence: false, duty: 0.40, desc: "Nylon rope/cordage" },
  // ── Chapter 57/58 ───────────────────────────────────────────────
  "57050000": { cbca: true, licence: false, duty: 0.40, desc: "Carpets/rugs of textile materials" },
  "58109900": { cbca: true, licence: false, duty: 0.40, desc: "Embroidery n.e.s." },
  // ── Chapter 61-63 ──────────────────────────────────────────────
  "61049000": { cbca: true, licence: false, duty: 0.40, desc: "Women's suits/dresses knitted" },
  "62049600": { cbca: true, licence: false, duty: 0.40, desc: "Women's trousers of synthetic fibres" },
  "62113200": { cbca: true, licence: false, duty: 0.40, desc: "Aprons/overalls of cotton" },
  "62141000": { cbca: true, licence: false, duty: 0.40, desc: "Shawls/scarves of silk" },
  "62149000": { cbca: true, licence: false, duty: 0.40, desc: "Shawls/scarves of other textiles" },
  "62179010": { cbca: true, licence: true,  duty: 0.40, desc: "Clothing accessories (controlled)" },
  "62179090": { cbca: true, licence: false, duty: 0.40, desc: "Other made-up clothing accessories" },
  "63039900": { cbca: true, licence: false, duty: 0.40, desc: "Curtains/net curtains of other textiles" },
  "63049990": { cbca: true, licence: false, duty: 0.40, desc: "Furnishing articles n.e.s." },
  "63079000": { cbca: true, licence: false, duty: 0.40, desc: "Made-up articles of textile n.e.s." },
  "63079090": { cbca: true, licence: false, duty: 0.40, desc: "Other made-up textile articles" },
  // ── Chapter 64 ─────────────────────────────────────────────────
  "64039900": { cbca: true, licence: false, duty: 0.40, desc: "Footwear with leather uppers" },
  "64069000": { cbca: true, licence: false, duty: 0.40, desc: "Parts of footwear" },
  "64069090": { cbca: true, licence: false, duty: 0.40, desc: "Other footwear parts" },
  // ── Chapter 65 ─────────────────────────────────────────────────
  "65070000": { cbca: true, licence: false, duty: 0.40, desc: "Hat-shapes/hat-forms" },
  // ── Chapter 67 ─────────────────────────────────────────────────
  "67021000": { cbca: true, licence: false, duty: 0.40, desc: "Artificial flowers/foliage" },
  "67030000": { cbca: true, licence: false, duty: 0.40, desc: "Human hair preparations" },
  "67049000": { cbca: true, licence: false, duty: 0.40, desc: "Wigs/false beards/eyelashes" },
  // ── Chapter 68/69 ──────────────────────────────────────────────
  "68042100": { cbca: true, licence: false, duty: 0.25, desc: "Grinding/sharpening wheels" },
  "69111000": { cbca: true, licence: false, duty: 0.40, desc: "Tableware of porcelain/china" },
  "69119000": { cbca: true, licence: false, duty: 0.40, desc: "Tableware of other ceramics" },
  "69120000": { cbca: true, licence: false, duty: 0.40, desc: "Ceramic tableware n.e.s." },
  "69139000": { cbca: true, licence: false, duty: 0.40, desc: "Ceramic statuettes/ornaments" },
  // ── Chapter 70 ─────────────────────────────────────────────────
  "70099200": { cbca: true, licence: false, duty: 0.40, desc: "Mirrors of glass, framed" },
  "70109000": { cbca: true, licence: false, duty: 0.40, desc: "Glass containers" },
  "70133700": { cbca: true, licence: false, duty: 0.40, desc: "Glassware for table use, other" },
  "70139900": { cbca: true, licence: false, duty: 0.40, desc: "Other glassware" },
  "70181000": { cbca: true, licence: false, duty: 0.40, desc: "Glass beads/imitation pearls" },
  // ── Chapter 71 ─────────────────────────────────────────────────
  "71132090": { cbca: true, licence: false, duty: 0.25, desc: "Jewellery of base metal" },
  "71179090": { cbca: true, licence: false, duty: 0.25, desc: "Imitation jewellery n.e.s." },
  // ── Chapter 73 ─────────────────────────────────────────────────
  "73042900": { cbca: true, licence: false, duty: 0.25, desc: "Seamless iron/steel tubes" },
  "73072200": { cbca: true, licence: false, duty: 0.25, desc: "Steel threaded elbows/fittings" },
  "73144100": { cbca: true, licence: false, duty: 0.25, desc: "Iron/steel wire cloth/grill" },
  "73170000": { cbca: true, licence: false, duty: 0.25, desc: "Nails/tacks/staples of iron/steel" },
  "73211190": { cbca: true, licence: false, duty: 0.40, desc: "Cooking appliances/bbq grills of iron" },
  "73218900": { cbca: true, licence: false, duty: 0.40, desc: "Other stoves/ranges of iron" },
  "73231000": { cbca: true, licence: false, duty: 0.40, desc: "Iron/steel wool/scourers" },
  "73239199": { cbca: true, licence: false, duty: 0.40, desc: "Household articles of iron/steel" },
  "73249000": { cbca: true, licence: false, duty: 0.40, desc: "Sanitary ware of iron/steel" },
  "73262090": { cbca: true, licence: false, duty: 0.25, desc: "Articles of iron/steel wire" },
  "73269099": { cbca: true, licence: false, duty: 0.25, desc: "Other articles of iron/steel" },
  // ── Chapter 76 ─────────────────────────────────────────────────
  "76071910": { cbca: true, licence: false, duty: 0.25, desc: "Aluminium foil" },
  "76121000": { cbca: true, licence: false, duty: 0.25, desc: "Aluminium containers for gas" },
  "76151000": { cbca: true, licence: false, duty: 0.40, desc: "Aluminium household articles" },
  "76169999": { cbca: true, licence: false, duty: 0.25, desc: "Other aluminium articles" },
  // ── Chapter 82 ─────────────────────────────────────────────────
  "82055100": { cbca: true, licence: false, duty: 0.40, desc: "Household tools — garlic press" },
  "82055190": { cbca: true, licence: false, duty: 0.40, desc: "Other household hand tools" },
  "82059090": { cbca: true, licence: false, duty: 0.40, desc: "Other hand tools n.e.s." },
  "82060010": { cbca: true, licence: false, duty: 0.25, desc: "Sets of hand tools" },
  "82072000": { cbca: true, licence: false, duty: 0.25, desc: "Dies for drawing/extruding metal" },
  "82130000": { cbca: true, licence: false, duty: 0.40, desc: "Scissors/tailors' shears" },
  "82141000": { cbca: true, licence: false, duty: 0.40, desc: "Paper knives/openers/pencil sharpeners" },
  "82142000": { cbca: true, licence: false, duty: 0.40, desc: "Manicure/pedicure instruments" },
  "82149090": { cbca: true, licence: false, duty: 0.40, desc: "Other articles for manicure" },
  "82152000": { cbca: true, licence: false, duty: 0.40, desc: "Spoons/ladles/forks of base metal" },
  "82159900": { cbca: true, licence: false, duty: 0.40, desc: "Other cutlery" },
  // ── Chapter 83 ─────────────────────────────────────────────────
  "83024110": { cbca: true, licence: false, duty: 0.40, desc: "Door hinges of base metal" },
  "83024900": { cbca: true, licence: false, duty: 0.40, desc: "Other mountings/fittings for furniture" },
  "83025000": { cbca: true, licence: false, duty: 0.40, desc: "Hat-racks/hat-pegs/brackets" },
  "83030000": { cbca: true, licence: false, duty: 0.40, desc: "Armoured safes/strong-boxes" },
  "83063000": { cbca: true, licence: false, duty: 0.40, desc: "Photo/picture/similar frames" },
  "83081000": { cbca: true, licence: false, duty: 0.25, desc: "Hooks/eyes/eyelets of base metal" },
  "83089000": { cbca: true, licence: false, duty: 0.25, desc: "Clasps/buckles/hooks n.e.s." },
  // ── Chapter 84 ─────────────────────────────────────────────────
  "84137000": { cbca: true, licence: false, duty: 0.25, desc: "Centrifugal pumps" },
  "84138100": { cbca: true, licence: false, duty: 0.25, desc: "Pumps for liquids" },
  "84139000": { cbca: true, licence: false, duty: 0.25, desc: "Parts of pumps" },
  "84142000": { cbca: true, licence: false, duty: 0.25, desc: "Hand/foot-operated air pumps" },
  "84145990": { cbca: true, licence: false, duty: 0.25, desc: "Fans/ventilating equipment" },
  "84186190": { cbca: true, licence: false, duty: 0.25, desc: "Refrigerating/freezing equipment" },
  "84198900": { cbca: true, licence: false, duty: 0.25, desc: "Machinery for treating materials by temp" },
  "84223000": { cbca: true, licence: false, duty: 0.25, desc: "Filling/sealing/capping machines" },
  "84231010": { cbca: true, licence: false, duty: 0.25, desc: "Personal weighing scales" },
  "84231090": { cbca: true, licence: false, duty: 0.25, desc: "Other personal weighing machines" },
  "84238190": { cbca: true, licence: false, duty: 0.25, desc: "Weighing machinery — kitchen scales" },
  "84242000": { cbca: true, licence: false, duty: 0.25, desc: "Spray guns/similar appliances" },
  "84243000": { cbca: true, licence: false, duty: 0.25, desc: "Steam/sand blasting machines" },
  "84314900": { cbca: true, licence: false, duty: 0.25, desc: "Parts for lifting/handling machinery" },
  "84381000": { cbca: true, licence: false, duty: 0.25, desc: "Bakery/pasta/confectionery machinery" },
  "84385000": { cbca: true, licence: false, duty: 0.25, desc: "Food/beverage processing machinery" },
  "84388000": { cbca: true, licence: false, duty: 0.25, desc: "Other food processing machinery" },
  "84401000": { cbca: true, licence: false, duty: 0.25, desc: "Bookbinding machinery" },
  "84482000": { cbca: true, licence: false, duty: 0.25, desc: "Textile machinery auxiliaries" },
  "84501900": { cbca: true, licence: false, duty: 0.25, desc: "Washing machines <= 10kg" },
  "84513000": { cbca: true, licence: false, duty: 0.25, desc: "Ironing machines" },
  "84521000": { cbca: true, licence: false, duty: 0.25, desc: "Sewing machines — household" },
  "84603900": { cbca: true, licence: false, duty: 0.25, desc: "Knife/tool sharpening machines" },
  "84659300": { cbca: true, licence: false, duty: 0.25, desc: "Grinding/sanding machines" },
  "84716000": { cbca: true, licence: false, duty: 0.25, desc: "Input/output units — keyboard/mouse" },
  "84735000": { cbca: true, licence: false, duty: 0.25, desc: "Computer parts/accessories" },
  "84798900": { cbca: true, licence: false, duty: 0.25, desc: "Machines/mechanical appliances n.e.s." },
  "84798990": { cbca: true, licence: false, duty: 0.25, desc: "Other mechanical appliances" },
  "84818000": { cbca: true, licence: false, duty: 0.25, desc: "Taps/cocks/valves n.e.s." },
  // ── Chapter 85 ─────────────────────────────────────────────────
  "85044000": { cbca: true, licence: false, duty: 0.25, desc: "Static converters/chargers" },
  "85068000": { cbca: true, licence: true,  duty: 0.25, desc: "Dry batteries (controlled)" },
  "85079010": { cbca: true, licence: true,  duty: 0.25, desc: "Battery storage parts (controlled)" },
  "85081100": { cbca: true, licence: false, duty: 0.25, desc: "Vacuum cleaners <= 1500W" },
  "85086000": { cbca: true, licence: false, duty: 0.25, desc: "Vacuum cleaners, other" },
  "85094000": { cbca: true, licence: false, duty: 0.25, desc: "Food grinders/mixers/juicers" },
  "85098000": { cbca: true, licence: false, duty: 0.25, desc: "Electromechanical domestic appliances" },
  "85099000": { cbca: true, licence: false, duty: 0.25, desc: "Parts of electromechanical appliances" },
  "85101000": { cbca: true, licence: false, duty: 0.25, desc: "Shavers/hair clippers" },
  "85102000": { cbca: true, licence: false, duty: 0.25, desc: "Hair removing appliances" },
  "85102090": { cbca: true, licence: false, duty: 0.25, desc: "Hair clippers electric" },
  "85103000": { cbca: true, licence: false, duty: 0.25, desc: "Hair-removing/epilating appliances" },
  "85104000": { cbca: true, licence: false, duty: 0.25, desc: "Facial skincare appliances" },
  "85109000": { cbca: true, licence: false, duty: 0.25, desc: "Parts of shavers/hair clippers" },
  "85122000": { cbca: true, licence: false, duty: 0.25, desc: "Lighting/visual signalling equipment" },
  "85163100": { cbca: true, licence: false, duty: 0.25, desc: "Hair dryers" },
  "85163200": { cbca: true, licence: false, duty: 0.25, desc: "Hair dressing appliances" },
  "85164000": { cbca: true, licence: false, duty: 0.25, desc: "Electric smoothing irons" },
  "85165000": { cbca: true, licence: false, duty: 0.25, desc: "Microwave ovens" },
  "85166000": { cbca: true, licence: false, duty: 0.25, desc: "Other ovens/cookers/grills" },
  "85167100": { cbca: true, licence: false, duty: 0.25, desc: "Coffee/tea making machines" },
  "85167900": { cbca: true, licence: false, duty: 0.25, desc: "Other electrothermic appliances" },
  "85168000": { cbca: true, licence: false, duty: 0.25, desc: "Electric heating resistors" },
  "85169000": { cbca: true, licence: false, duty: 0.25, desc: "Parts of electric heating appliances" },
  "85181000": { cbca: true, licence: false, duty: 0.25, desc: "Microphones/earphones" },
  "85182100": { cbca: true, licence: false, duty: 0.25, desc: "Single loudspeakers" },
  "85183000": { cbca: true, licence: false, duty: 0.25, desc: "Headphones/earphones" },
  "85198900": { cbca: true, licence: false, duty: 0.25, desc: "Sound recording apparatus" },
  "85256000": { cbca: true, licence: false, duty: 0.25, desc: "Transmit-receive apparatus (walkie-talkie)" },
  "85269290": { cbca: true, licence: false, duty: 0.25, desc: "Remote control apparatus" },
  "85369000": { cbca: true, licence: false, duty: 0.25, desc: "Electrical connectors n.e.s." },
  "85414200": { cbca: true, licence: false, duty: 0.25, desc: "Photovoltaic cells/panels" },
  "85423900": { cbca: true, licence: false, duty: 0.25, desc: "Electronic integrated circuits" },
  "85437000": { cbca: true, licence: false, duty: 0.25, desc: "Electronic machines n.e.s." },
  "85438900": { cbca: true, licence: false, duty: 0.25, desc: "Electrical machines n.e.s." },
  "85444200": { cbca: true, licence: false, duty: 0.25, desc: "Electric conductors <= 80V" },
  "85469000": { cbca: true, licence: false, duty: 0.25, desc: "Electrical insulators" },
  // ── Chapter 87 ─────────────────────────────────────────────────
  "87089990": { cbca: true, licence: false, duty: 0.25, desc: "Parts/accessories of motor vehicles" },
  "87120000": { cbca: true, licence: false, duty: 0.40, desc: "Bicycles" },
  "87149600": { cbca: true, licence: false, duty: 0.40, desc: "Bicycle parts/accessories" },
  // ── Chapter 90 ─────────────────────────────────────────────────
  "90022000": { cbca: true, licence: false, duty: 0.25, desc: "Optical lenses/filters" },
  "90069900": { cbca: true, licence: false, duty: 0.25, desc: "Camera parts/accessories" },
  "90106000": { cbca: true, licence: false, duty: 0.25, desc: "Projectors/projection equipment" },
  "90181000": { cbca: true, licence: false, duty: 0.15, desc: "Electro-diagnostic apparatus (MCAZ licence)" },
  "90183900": { cbca: true, licence: true,  duty: 0.15, desc: "Medical syringes/needles (MCAZ licence)" },
  "90184900": { cbca: true, licence: true,  duty: 0.15, desc: "Dental instruments (MCAZ licence)" },
  "90189000": { cbca: true, licence: true,  duty: 0.15, desc: "Medical instruments n.e.s. (MCAZ licence)" },
  "90191000": { cbca: true, licence: false, duty: 0.25, desc: "Mechano-therapy/massage apparatus" },
  "90191010": { cbca: true, licence: false, duty: 0.25, desc: "Massage apparatus — fitness" },
  "90211000": { cbca: true, licence: true,  duty: 0.15, desc: "Orthopaedic appliances (MCAZ licence)" },
  "90213100": { cbca: true, licence: true,  duty: 0.15, desc: "Artificial joints (MCAZ licence)" },
  "90213900": { cbca: true, licence: true,  duty: 0.15, desc: "Orthopaedic splints/braces" },
  "90219000": { cbca: true, licence: false, duty: 0.15, desc: "Other orthopaedic devices" },
  "90229000": { cbca: true, licence: false, duty: 0.15, desc: "X-ray/radiation apparatus parts" },
  "90248000": { cbca: true, licence: false, duty: 0.25, desc: "Testing/measuring machines" },
  // ── Chapter 91 ─────────────────────────────────────────────────
  "91019900": { cbca: true, licence: false, duty: 0.40, desc: "Wrist-watches" },
  "91144000": { cbca: true, licence: false, duty: 0.40, desc: "Clock parts" },
  // ── Chapter 92 ─────────────────────────────────────────────────
  "92059000": { cbca: true, licence: false, duty: 0.40, desc: "Other musical instruments" },
  // ── Chapter 94 ─────────────────────────────────────────────────
  "94016100": { cbca: true, licence: false, duty: 0.40, desc: "Upholstered seats of wood" },
  "94018000": { cbca: true, licence: false, duty: 0.40, desc: "Other seats" },
  "94019000": { cbca: true, licence: false, duty: 0.40, desc: "Parts of seats" },
  "94033000": { cbca: true, licence: false, duty: 0.40, desc: "Wooden office furniture" },
  "94036000": { cbca: true, licence: false, duty: 0.40, desc: "Other wooden furniture" },
  "94038900": { cbca: true, licence: false, duty: 0.40, desc: "Other furniture" },
  "94049000": { cbca: true, licence: false, duty: 0.40, desc: "Mattress supports/bedding" },
  "94052190": { cbca: true, licence: false, duty: 0.40, desc: "Ceiling/wall lamps — LED" },
  // ── Chapter 95 ─────────────────────────────────────────────────
  "95030000": { cbca: true, licence: false, duty: 0.40, desc: "Tricycles/scooters/toy wheeled vehicles" },
  "95032000": { cbca: true, licence: false, duty: 0.40, desc: "Toy dolls/electric trains" },
  "95045000": { cbca: true, licence: false, duty: 0.40, desc: "Video game consoles" },
  "95049000": { cbca: true, licence: false, duty: 0.40, desc: "Games/toys n.e.s." },
  "95066200": { cbca: true, licence: false, duty: 0.40, desc: "Balls for tennis/volleyball etc." },
  "95069100": { cbca: true, licence: false, duty: 0.40, desc: "Articles for gym/athletics" },
  "95069900": { cbca: true, licence: false, duty: 0.40, desc: "Other sports articles" },
  "95079000": { cbca: true, licence: false, duty: 0.40, desc: "Fishing equipment n.e.s." },
  // ── Chapter 96 ─────────────────────────────────────────────────
  "96031000": { cbca: true, licence: false, duty: 0.40, desc: "Brooms/brushes of vegetable material" },
  "96032100": { cbca: true, licence: false, duty: 0.40, desc: "Toothbrushes/shaving brushes" },
  "96033000": { cbca: true, licence: false, duty: 0.40, desc: "Artists' brushes/make-up brushes" },
  "96039000": { cbca: true, licence: false, duty: 0.40, desc: "Other brushes/brooms" },
  "96081000": { cbca: true, licence: false, duty: 0.40, desc: "Ballpoint pens" },
  "96086000": { cbca: true, licence: false, duty: 0.40, desc: "Felt pens/marker pens" },
  "96100000": { cbca: true, licence: false, duty: 0.40, desc: "Slates/boards for writing/drawing" },
  "96138000": { cbca: true, licence: false, duty: 0.40, desc: "Lighters n.e.s." },
  "96151100": { cbca: true, licence: false, duty: 0.40, desc: "Combs/hair-slides of hard rubber" },
  "96159000": { cbca: true, licence: false, duty: 0.40, desc: "Combs/barrettes/hair accessories" },
  "96161000": { cbca: true, licence: false, duty: 0.40, desc: "Scent sprays/mounts" },
  "96162000": { cbca: true, licence: false, duty: 0.40, desc: "Powder puffs/cosmetic pads" },
  "96170000": { cbca: true, licence: false, duty: 0.40, desc: "Vacuum flasks/insulated vessels" },
  // ── Chapter 97 ─────────────────────────────────────────────────
  "97019100": { cbca: true, licence: false, duty: 0.10, desc: "Paintings/drawings/pastels originals" },
};

// Normalise HS code — strip dots, pad to 8 digits
function normaliseHS(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\./g, "").replace(/[^0-9]/g, "");
  if (s.length < 6) return null;
  return s.padEnd(8, "0").slice(0, 8);
}

function lookupHS(raw) {
  const hs = normaliseHS(raw);
  if (!hs) return null;
  // exact 8-digit lookup first
  if (HS_KNOWLEDGE[hs]) return { ...HS_KNOWLEDGE[hs], code: hs };
  // fall back to 6-digit stem
  const stem6 = hs.slice(0, 6) + "00";
  if (HS_KNOWLEDGE[stem6]) return { ...HS_KNOWLEDGE[stem6], code: hs };
  // 4-digit chapter fallback
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   CHUNK PROCESSOR
   Splits large invoices into batches of MAX_BATCH items before
   sending to Claude to avoid token-limit JSON truncation errors.
   ═══════════════════════════════════════════════════════════════════ */
const MAX_BATCH = 80;  // max line items per API call

function chunkLines(lines) {
  const chunks = [];
  for (let i = 0; i < lines.length; i += MAX_BATCH) {
    chunks.push(lines.slice(i, i + MAX_BATCH));
  }
  return chunks;
}

// Parse raw text to extract line-item table rows
function parseLineTable(text) {
  const lines = text.split("\n");
  const rows = [];
  for (const line of lines) {
    // Match patterns like: "1 Chocolate 18069010 5 103.59" or "1 Chocolate 5 103.59"
    const m = line.match(/^\s*(\d+)\s+(.+?)\s+(\d{8})?\s+(\d+)\s+([\d,]+\.?\d*)\s*$/);
    if (m) {
      rows.push({
        no: parseInt(m[1]),
        desc: m[2].trim(),
        hs: m[3] || null,
        qty: parseInt(m[4]),
        value: parseFloat(m[5].replace(",", "")),
      });
    }
  }
  return rows;
}

/* ═══════════════════════════════════════════════════════════════════
   CLAUDE SYSTEM PROMPT — trained with Zimbabwe regulatory context
   ═══════════════════════════════════════════════════════════════════ */

const SYSTEM = `You are Lunarae, a Zimbabwe customs AI expert specialising in ZIMRA Customs and Excise Act [Chapter 23:02].

CRITICAL RULES:
1. Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
2. For EACH line item, you MUST provide an 8-digit HS code.
3. If the document already has HS codes, USE THEM EXACTLY as given.
4. If no HS codes are provided, classify using your Zimbabwe Tariff Book knowledge.

DUTY CALCULATIONS (Zimbabwe):
- CIF Value = FOB + (Freight × FOB/Total_FOB) + (Insurance × FOB/Total_FOB)
- Customs Duty = CIF Value × Duty Rate
- VAT Base = CIF Value + Customs Duty
- VAT = VAT Base × 14.5%
- Total Duty = Customs Duty + VAT

DEFAULT DUTY RATES BY CHAPTER (when not specified):
- Ch 18 (Food/Chocolate): 40%
- Ch 30 (Pharma/Medical): 15% + MCAZ licence required
- Ch 32-34 (Cosmetics/Toiletries): 40%
- Ch 33 (Essential oils/Perfumes): 25%
- Ch 38-40 (Chemical products/Rubber): 25%
- Ch 42 (Leather goods/Bags): 40%
- Ch 44/46 (Wood/Wicker): 40%
- Ch 48 (Paper/Stationery): 25%
- Ch 52-63 (Textiles/Clothing): 40%
- Ch 64 (Footwear): 40%
- Ch 67-70 (Glass/Ceramic/Jewellery): 40%
- Ch 71 (Jewellery): 25%
- Ch 73-76 (Metal goods): 25%
- Ch 82-83 (Tools/Hardware): 25-40%
- Ch 84 (Machinery/Appliances): 25%
- Ch 85 (Electronics): 25%
- Ch 85068000 Batteries: 25% + IMPORT LICENCE
- Ch 87 (Vehicles/Parts): 25%
- Ch 90 (Medical/Optical): 15%
- Ch 91 (Watches): 40%
- Ch 94 (Furniture/Lamps): 40%
- Ch 95 (Toys/Sports): 40%
- Ch 96 (Miscellaneous manufactured): 40%
- Ch 97 (Art/Paintings): 10%

CBCA (Cross Border Currency Act SI 35/2024):
- ALL goods from this type of mixed consignment invoice are subject to CBCA
- Set cbca_required: true for ALL items

IMPORT LICENCE requirements (SI 122/2017):
- HS 3004.xx = MCAZ pharmaceutical licence
- HS 3402.xx = Surface-active agent licence  
- HS 6217.90 = Clothing accessories licence
- HS 8506/8507 = Battery licence
- HS 9018/9019/9021 = Medical devices = MCAZ licence

Return JSON structure:
{
  "entry_type": "Home Consumption",
  "importer": string,
  "importer_tin": string,
  "exporter": string,
  "country_of_origin": string,
  "port_of_entry": string,
  "mode_of_transport": string,
  "freight_usd": number,
  "insurance_usd": number,
  "line_items": [
    {
      "line_no": number,
      "description": string,
      "hs_code": string,
      "quantity": number,
      "unit": "PCS",
      "unit_value_usd": number,
      "fob_value_usd": number,
      "cif_value_usd": number,
      "duty_rate": number,
      "customs_duty_usd": number,
      "vat_base_usd": number,
      "vat_usd": number,
      "total_duty_usd": number,
      "cbca_required": boolean,
      "import_licence_required": boolean,
      "licence_authority": string,
      "compliance_status": "CLEAR"|"CBCA_REQUIRED"|"LICENCE_REQUIRED"|"CBCA+LICENCE"|"PROHIBITED",
      "permit_notes": string
    }
  ],
  "totals": {
    "total_fob_usd": number,
    "total_cif_usd": number,
    "total_customs_duty_usd": number,
    "total_vat_usd": number,
    "total_duty_payable_usd": number,
    "total_duty_payable_zwg": number
  },
  "compliance_alerts": [
    { "severity": "HIGH"|"MEDIUM"|"INFO", "item": string, "alert": string, "action_required": string }
  ],
  "boe_notes": string,
  "ready_to_register": boolean
}`;

/* ═══════════════════════════════════════════════════════════════════
   LOCAL ENRICHMENT — apply our HS knowledge base to AI results
   This corrects/supplements the AI's output using our training data
   ═══════════════════════════════════════════════════════════════════ */
function enrichWithKnowledgeBase(result, rbzRate) {
  const rbz = parseFloat(rbzRate) || 13.5;
  const totalFob = result.totals?.total_fob_usd || 1;
  const freight = result.freight_usd || 0;
  const insurance = result.insurance_usd || 0;

  const enriched = (result.line_items || []).map(item => {
    const kb = lookupHS(item.hs_code);
    if (!kb) {
      // Normalize AI-returned duty_rate: AI sometimes returns 40 (percent) instead of 0.40 (decimal)
      const raw = Number(item.duty_rate || 0);
      const normDuty = raw > 1.5 ? raw / 100 : raw;
      return { ...item, duty_rate: normDuty, confidence: 70 };
    }

    // Recalculate with correct duty rate from KB
    const fob = item.fob_value_usd || 0;
    const itemFreight = freight * (fob / totalFob);
    const itemInsurance = insurance * (fob / totalFob);
    const cif = fob + itemFreight + itemInsurance;
    const dutyAmt = cif * kb.duty;
    const vatBase = cif + dutyAmt;
    const vatAmt = vatBase * 0.145;

    const cbca = kb.cbca;
    const licence = kb.licence || item.import_licence_required;
    let status = "CLEAR";
    if (cbca && licence) status = "CBCA+LICENCE";
    else if (cbca) status = "CBCA_REQUIRED";
    else if (licence) status = "LICENCE_REQUIRED";

    return {
      ...item,
      hs_code: kb.code || item.hs_code,
      cif_value_usd: parseFloat(cif.toFixed(2)),
      duty_rate: kb.duty,
      customs_duty_usd: parseFloat(dutyAmt.toFixed(2)),
      vat_base_usd: parseFloat(vatBase.toFixed(2)),
      vat_usd: parseFloat(vatAmt.toFixed(2)),
      total_duty_usd: parseFloat((dutyAmt + vatAmt).toFixed(2)),
      cbca_required: cbca,
      import_licence_required: licence,
      compliance_status: status,
      confidence: 97,
    };
  });

  // Recalculate totals
  const totalCustDuty = enriched.reduce((s, i) => s + (i.customs_duty_usd || 0), 0);
  const totalVat = enriched.reduce((s, i) => s + (i.vat_usd || 0), 0);
  const totalCif = enriched.reduce((s, i) => s + (i.cif_value_usd || 0), 0);
  const totalPayable = totalCustDuty + totalVat;

  return {
    ...result,
    line_items: enriched,
    totals: {
      ...result.totals,
      total_cif_usd: parseFloat(totalCif.toFixed(2)),
      total_customs_duty_usd: parseFloat(totalCustDuty.toFixed(2)),
      total_vat_usd: parseFloat(totalVat.toFixed(2)),
      total_duty_payable_usd: parseFloat(totalPayable.toFixed(2)),
      total_duty_payable_zwg: parseFloat((totalPayable * rbz).toFixed(2)),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   ASYCUDA XML GENERATOR
   ═══════════════════════════════════════════════════════════════════ */
function generateASYCUDAXml(boe, rbzRate) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const ref = `LUN-${Date.now().toString().slice(-8)}`;
  const rbz = parseFloat(rbzRate) || 13.5;
  const portCodes = {
    "Beitbridge": "ZWBB", "Forbes (Mutare)": "ZWMT", "Chirundu": "ZWCH",
    "Plumtree": "ZWPL", "Victoria Falls": "ZWVF",
    "Harare Airport": "ZWHA", "Bulawayo Airport": "ZWBA",
  };
  const officeCode = portCodes[boe.port_of_entry] || "ZWBB";
  const officeName = `${(boe.port_of_entry || "BEITBRIDGE").toUpperCase()} CUSTOM HOUSE`;
  const modeCode = { Road:"30", Air:"40", Sea:"10", Rail:"20" }[boe.mode_of_transport] || "30";
  const totalFob = boe.totals?.total_fob_usd || 1;
  const freightUsd = boe.freight_usd || 0;
  const insuranceUsd = boe.insurance_usd || 0;
  const n = (v, d=2) => Number(v||0).toFixed(d);
  const nn = v => Number(v||0);

  const itemsXml = (boe.line_items || []).map(item => {
    const fob = nn(item.fob_value_usd);
    const cif = nn(item.cif_value_usd);
    const cifZwg = cif * rbz;
    const dutyAmt = nn(item.customs_duty_usd) * rbz;
    const vatAmt = nn(item.vat_usd) * rbz;
    const totalTax = dutyAmt + vatAmt;
    const hs = normaliseHS(item.hs_code) || "00000000";
    return `  <Item>
    <Packages>
      <Number_of_packages>${item.quantity||0}</Number_of_packages>
      <Marks1_of_packages>ADD</Marks1_of_packages>
      <Kind_of_packages_code>15</Kind_of_packages_code>
      <Kind_of_packages_name>Part of a package</Kind_of_packages_name>
    </Packages>
    <Tarification>
      <HScode>
        <Commodity_code>${hs}</Commodity_code>
        <Precision_1>000</Precision_1>
      </HScode>
      <Extended_customs_procedure>4000</Extended_customs_procedure>
      <National_customs_procedure>000</National_customs_procedure>
      <Item_price>${n(fob * rbz)}</Item_price>
    </Tarification>
    <Goods_description>
      <Country_of_origin_code>ZA</Country_of_origin_code>
      <Description_of_goods>${String(item.description||"").slice(0,70)}</Description_of_goods>
      <Commercial_Description>${String(item.description||"").slice(0,70)}</Commercial_Description>
    </Goods_description>
    <Licence_number>${item.import_licence_required?"REQD":"OGIL"}</Licence_number>
    <Taxation>
      <Item_taxes_amount>${n(totalTax)}</Item_taxes_amount>
      <Item_taxes_mode_of_payment>1</Item_taxes_mode_of_payment>
      <Taxation_line>
        <Duty_tax_code>101</Duty_tax_code>
        <Duty_tax_Base>${n(cifZwg)}</Duty_tax_Base>
        <Duty_tax_rate>${n(nn(item.duty_rate)*100,1)}</Duty_tax_rate>
        <Duty_tax_amount>${n(dutyAmt)}</Duty_tax_amount>
        <Duty_tax_MP>1</Duty_tax_MP>
      </Taxation_line>
      <Taxation_line>
        <Duty_tax_code>102</Duty_tax_code>
        <Duty_tax_Base>${n((cif + nn(item.customs_duty_usd)) * rbz)}</Duty_tax_Base>
        <Duty_tax_rate>14.5</Duty_tax_rate>
        <Duty_tax_amount>${n(vatAmt)}</Duty_tax_amount>
        <Duty_tax_MP>1</Duty_tax_MP>
      </Taxation_line>
    </Taxation>
    <Valuation_item>
      <Weight_itm><Gross_weight_itm>1</Gross_weight_itm><Net_weight_itm>1</Net_weight_itm></Weight_itm>
      <Total_CIF_itm>${n(cifZwg)}</Total_CIF_itm>
      <Statistical_value>${n(cifZwg)}</Statistical_value>
      <Item_Invoice>
        <Amount_national_currency>${n(fob*rbz)}</Amount_national_currency>
        <Amount_foreign_currency>${n(fob)}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </Item_Invoice>
      <item_internal_freight>
        <Amount_foreign_currency>${n(freightUsd*fob/Math.max(totalFob,1))}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </item_internal_freight>
      <item_insurance>
        <Amount_foreign_currency>${n(insuranceUsd*fob/Math.max(totalFob,1))}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </item_insurance>
    </Valuation_item>
  </Item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ASYCUDA>
  <Property>
    <Forms><Number_of_the_form>1</Number_of_the_form><Total_number_of_forms>1</Total_number_of_forms></Forms>
    <Nbers>
      <Total_number_of_items>${(boe.line_items||[]).length}</Total_number_of_items>
      <Total_number_of_packages>${(boe.line_items||[]).reduce((s,i)=>s+(i.quantity||0),0)}</Total_number_of_packages>
    </Nbers>
    <Date_of_declaration>${dateStr}</Date_of_declaration>
  </Property>
  <Identification>
    <Office_segment>
      <Customs_clearance_office_code>${officeCode}</Customs_clearance_office_code>
      <Customs_Clearance_office_name>${officeName}</Customs_Clearance_office_name>
    </Office_segment>
    <Type>
      <Type_of_declaration>IM</Type_of_declaration>
      <Declaration_gen_procedure_code>4</Declaration_gen_procedure_code>
    </Type>
  </Identification>
  <Traders>
    <Exporter><Exporter_name>${(boe.exporter||"").toUpperCase()}</Exporter_name></Exporter>
    <Consignee><Consignee_name>${(boe.importer||"").toUpperCase()}</Consignee_name></Consignee>
  </Traders>
  <Declarant>
    <Declarant_code>${boe.importer_tin||""}</Declarant_code>
    <Declarant_name>${(boe.importer||"").toUpperCase()}</Declarant_name>
    <Reference><Number>${ref}</Number></Reference>
  </Declarant>
  <General_information>
    <Country>
      <Export><Export_country_code>ZA</Export_country_code><Export_country_name>${boe.country_of_origin||"South Africa"}</Export_country_name></Export>
      <Destination><Destination_country_code>ZW</Destination_country_code><Destination_country_name>Zimbabwe</Destination_country_name></Destination>
    </Country>
    <Value_details>${n(totalFob*rbz)}</Value_details>
  </General_information>
  <Transport>
    <Means_of_transport>
      <Border_information><Identity>ADD</Identity><Nationality>ZA</Nationality><Mode>${modeCode}</Mode></Border_information>
    </Means_of_transport>
    <Delivery_terms><Code>CIF</Code><Place>${(boe.port_of_entry||"BEITBRIDGE").toUpperCase()}</Place></Delivery_terms>
    <Location_of_goods>LOC07</Location_of_goods>
  </Transport>
  <Valuation>
    <Total_cost>${n(totalFob*rbz)}</Total_cost>
    <Total_CIF>${n((boe.totals?.total_cif_usd||totalFob)*rbz)}</Total_CIF>
    <Gs_Invoice>
      <Amount_national_currency>${n(totalFob*rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(totalFob)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_Invoice>
    <Gs_internal_freight>
      <Amount_national_currency>${n(freightUsd*rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(freightUsd)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_internal_freight>
    <Gs_insurance>
      <Amount_national_currency>${n(insuranceUsd*rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(insuranceUsd)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_insurance>
  </Valuation>
${itemsXml}
</ASYCUDA>`;
}

function downloadXml(boe, rbzRate) {
  const xml = generateASYCUDAXml(boe, rbzRate);
  const blob = new Blob([xml], { type:"application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Lunarae_ASYCUDA_${Date.now().toString().slice(-8)}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  CLEAR:            { bg:"#dcfce7", color:"#15803d", dot:"#22c55e" },
  CBCA_REQUIRED:    { bg:"#fef9c3", color:"#a16207", dot:"#eab308" },
  "CBCA+LICENCE":   { bg:"#fff7ed", color:"#c2410c", dot:"#f97316" },
  LICENCE_REQUIRED: { bg:"#fff7ed", color:"#c2410c", dot:"#f97316" },
  PROHIBITED:       { bg:"#fee2e2", color:"#b91c1c", dot:"#ef4444" },
  FLAGGED:          { bg:"#fef3c7", color:"#92400e", dot:"#f59e0b" },
};
const ALERT_MAP = {
  HIGH:   { bg:"#fee2e2", border:"#fca5a5", color:"#991b1b", icon:"⛔" },
  MEDIUM: { bg:"#fff7ed", border:"#fed7aa", color:"#9a3412", icon:"⚠️" },
  INFO:   { bg:"#eff6ff", border:"#bfdbfe", color:"#1e40af", icon:"ℹ️" },
};
const fmtUSD = v => v!=null ? `$${Number(v).toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—";
const fmtPct = v => v!=null ? `${(Number(v)*100).toFixed(1)}%` : "—";

const stages = [
  "Reading shipping documents…",
  "Extracting line items…",
  "Classifying HS codes from knowledge base…",
  "Applying Zimbabwe Tariff Book rates…",
  "Checking SI 122/2017 licences…",
  "Verifying SI 35/2024 CBCA requirements…",
  "Calculating duties & VAT…",
  "Generating compliance advisory…",
  "Finalising ZIMRA CF21…",
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function LunaraeV2({ onNavigate }) {
  const [docText, setDocText]     = useState("");
  const [fileName, setFileName]   = useState("");
  const [entryType, setEntryType] = useState("Home Consumption");
  const [transport, setTransport] = useState("Road");
  const [rbzRate, setRbzRate]     = useState("13.50");
  const [portEntry, setPortEntry] = useState("Beitbridge");
  const [loading, setLoading]     = useState(false);
  const [stageIdx, setStageIdx]   = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [view, setView]           = useState("input");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileWarning, setFileWarning] = useState("");
  const [progress, setProgress]   = useState("");
  const fileRef = useRef();
  const timerRef = useRef();
  const [mobParams, setMobParams] = useState(false);

  const { user } = useAuth();

  /* ── Reopen a saved BOE placed in sessionStorage by BoeHistory ── */
  useEffect(() => {
    const stored = sessionStorage.getItem("lunarae_reopen_boe");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
        setView("results");
      } catch {}
      sessionStorage.removeItem("lunarae_reopen_boe");
    }
  }, []);

  /* ── Fire-and-forget BOE save after generation ─────────────────── */
  function saveBoeAsync(finalResult, rbzRateValue) {
    const token = localStorage.getItem("lunarae_auth_token");
    if (!token || !user?.company_id) return;
    try {
      const xml = generateASYCUDAXml(finalResult, rbzRateValue);
      fetch("/api/boes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          importer:      finalResult.importer      || "",
          exporter:      finalResult.exporter      || "",
          total_duty:    finalResult.totals?.total_customs_duty_usd    || 0,
          total_vat:     finalResult.totals?.total_vat_usd             || 0,
          total_payable: finalResult.totals?.total_duty_payable_usd    || 0,
          xml_data:      xml,
          result_json:   JSON.stringify(finalResult),
        }),
      }).catch(() => {}); // swallow errors — save is best-effort
    } catch {}
  }

  useEffect(() => {
    if (loading) {
      setStageIdx(0);
      timerRef.current = setInterval(() => setStageIdx(i => Math.min(i+1, stages.length-1)), 1200);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setFileName(f.name); setFileWarning(""); setFileLoading(true);
    try {
      if (f.type==="text/plain" || f.name.endsWith(".txt") || f.name.endsWith(".csv")) {
        setDocText(await f.text());
      } else if (f.name.endsWith(".xml")) {
        setDocText(await f.text());
      } else {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/extract", { method:"POST", body:fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error||"Extraction failed");
        if (data.warning) setFileWarning(data.warning);
        if (data.text) setDocText(data.text);
      }
    } catch (e) {
      setFileWarning(`Could not read file: ${e.message}. Paste text manually.`);
    } finally {
      setFileLoading(false);
    }
  }, []);

  /* ── Run analysis with chunking for large invoices ── */
  const run = useCallback(async () => {
    if (!docText.trim()) return;
    setLoading(true); setResult(null); setError(null); setView("results"); setProgress("");

    try {
      // Parse line table from document to determine if chunking is needed
      const parsedLines = parseLineTable(docText);
      const needsChunking = parsedLines.length > MAX_BATCH;

      let finalResult = null;

      if (needsChunking) {
        // --- CHUNKED PROCESSING ---
        const chunks = chunkLines(parsedLines);
        setProgress(`Processing ${parsedLines.length} items in ${chunks.length} batches…`);

        // First call: get header info + first batch
        const headerPrompt = `Process this invoice. Entry: ${entryType}. Transport: ${transport}. Port: ${portEntry}. RBZ: ${rbzRate}.
Total items in full invoice: ${parsedLines.length}. Total FOB: USD ${parsedLines.reduce((s,l)=>s+l.value,0).toFixed(2)}.
Freight estimate: USD ${(parsedLines.reduce((s,l)=>s+l.value,0)*0.005).toFixed(2)}. Insurance: USD ${(parsedLines.reduce((s,l)=>s+l.value,0)*0.001).toFixed(2)}.

PROCESS ONLY THESE ${chunks[0].length} ITEMS (batch 1 of ${chunks.length}):
${chunks[0].map(l=>`${l.no}. ${l.desc}${l.hs?" HS:"+l.hs:""} QTY:${l.qty} USD:${l.value}`).join("\n")}

Return ONLY line_items array for these items (no totals/header needed):
{"line_items":[...]}`;

        const allItems = [];
        let headerInfo = null;

        for (let ci = 0; ci < chunks.length; ci++) {
          setProgress(`Batch ${ci+1}/${chunks.length} — items ${chunks[ci][0].no}–${chunks[ci][chunks[ci].length-1].no}…`);

          const batchPrompt = ci === 0
            ? headerPrompt
            : `Continue processing. Same invoice (${entryType}, ${portEntry}, RBZ ${rbzRate}).
PROCESS ONLY THESE ${chunks[ci].length} ITEMS (batch ${ci+1} of ${chunks.length}):
${chunks[ci].map(l=>`${l.no}. ${l.desc}${l.hs?" HS:"+l.hs:""} QTY:${l.qty} USD:${l.value}`).join("\n")}

Return ONLY: {"line_items":[...]}`;

          const res = await fetch("/api/claude", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              model:"claude-sonnet-4-20250514",
              max_tokens:4000,
              system: SYSTEM,
              messages:[{ role:"user", content:batchPrompt }]
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message||"API error");
          const raw = (data.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
          const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
          if (s===-1) throw new Error(`Batch ${ci+1}: No JSON`);
          const batch = JSON.parse(raw.slice(s,e+1));

          // Extract header info from first batch
          if (ci===0 && batch.importer) headerInfo = batch;
          if (batch.line_items) allItems.push(...batch.line_items);
        }

        // Assemble final result
        const totalFob = parsedLines.reduce((s,l)=>s+l.value,0);
        const freight = totalFob * 0.005;
        const insurance = totalFob * 0.001;
        finalResult = {
          entry_type: entryType,
          importer: headerInfo?.importer || "UNKNOWN",
          importer_tin: headerInfo?.importer_tin || "",
          exporter: headerInfo?.exporter || "UNKNOWN",
          country_of_origin: headerInfo?.country_of_origin || "South Africa",
          port_of_entry: portEntry,
          mode_of_transport: transport,
          freight_usd: parseFloat(freight.toFixed(2)),
          insurance_usd: parseFloat(insurance.toFixed(2)),
          line_items: allItems,
          totals: {
            total_fob_usd: parseFloat(totalFob.toFixed(2)),
            total_cif_usd: parseFloat((totalFob+freight+insurance).toFixed(2)),
            total_customs_duty_usd: 0,
            total_vat_usd: 0,
            total_duty_payable_usd: 0,
            total_duty_payable_zwg: 0,
          },
          compliance_alerts: headerInfo?.compliance_alerts || [],
          boe_notes: `Processed ${allItems.length} items in ${chunks.length} batches. All items subject to CBCA (SI 35/2024).`,
          ready_to_register: false,
        };

      } else {
        // --- SINGLE CALL (small invoices) ---
        const res = await fetch("/api/claude", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            model:"claude-sonnet-4-20250514",
            max_tokens:4000,
            system: SYSTEM,
            messages:[{
              role:"user",
              content:`Process this invoice. Entry: ${entryType}. Transport: ${transport}. Port: ${portEntry}. RBZ: ${rbzRate} ZWG/USD.\n\nDOCUMENT:\n${docText}`
            }]
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message||"API error");
        const raw = (data.content?.[0]?.text||"").replace(/```json|```/g,"").trim();
        const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
        if (s===-1) throw new Error("No JSON in response");
        finalResult = JSON.parse(raw.slice(s,e+1));
      }

      // Apply local knowledge base enrichment
      setProgress("Applying Zimbabwe knowledge base…");
      finalResult = enrichWithKnowledgeBase(finalResult, rbzRate);
      setResult(finalResult);
      saveBoeAsync(finalResult, rbzRate);

    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [docText, entryType, transport, portEntry, rbzRate]);

  const readyColor = result?.ready_to_register ? "#22c55e" : "#f59e0b";

  return (
    <>
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", background:"#080d18", minHeight:"100vh", color:"#e2e8f0", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0f1729}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#eab308}
        .ls{background:#0f1729;border:1px solid #1e2d47;border-radius:8px;color:#e2e8f0;font-family:inherit;font-size:13px;padding:9px 12px;outline:none;width:100%;transition:border-color .15s}
        .ls:focus{border-color:#eab308}
        .lb{border:none;border-radius:10px;padding:11px 18px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
        .lb:disabled{opacity:.5;cursor:not-allowed}
        .lb:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.1)}
        .lp{background:linear-gradient(135deg,#eab308,#ca8a04);color:#0a0f1e}
        .lg2{background:#0f1729;border:1px solid #1e2d47;color:#94a3b8}
        .lg2:hover:not(:disabled){border-color:#eab308;color:#eab308;transform:none;filter:none}
        .lx{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff}
        .lpdf{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
        .lcard{background:#0d1525;border:1px solid #1e2d47;border-radius:14px;padding:20px}
        .lsm{background:#0d1525;border:1px solid #1e2d47;border-radius:10px;padding:14px 16px}
        .stat{background:#0d1525;border:1px solid #1e2d47;border-radius:12px;padding:16px;text-align:center}
        .tab{background:transparent;border:1px solid #1e2d47;border-radius:8px;color:#64748b;font-family:inherit;font-size:12px;font-weight:500;padding:7px 14px;cursor:pointer;transition:all .15s}
        .tab.on{background:#0d1525;border-color:#eab308;color:#eab308}
        .tab:hover:not(.on){border-color:#334155;color:#94a3b8}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .spin{animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fadeup{animation:fadeUp .35s ease forwards}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .tdoc{background:#06090f;border:1px solid #1e2d47;border-radius:10px;color:#cbd5e1;font-family:'JetBrains Mono',monospace;font-size:11.5px;padding:12px 14px;resize:vertical;outline:none;width:100%;min-height:140px;line-height:1.7;transition:border-color .15s}
        .tdoc:focus{border-color:#eab308}
        .dz{border:1.5px dashed #1e2d47;border-radius:12px;padding:24px 16px;text-align:center;cursor:pointer;transition:all .2s}
        .dz:hover,.dz.drag{border-color:#eab308;background:rgba(234,179,8,.04)}
        tr.irow:hover{background:rgba(234,179,8,.04)!important}
        .hz{border:none;border-top:1px solid #1e2d47;margin:8px 0}
        .mob-params-btn{display:none}
        .mob-close-btn{display:none}
        @media(max-width:768px){
          .mlayout{grid-template-columns:1fr!important}
          .sdbk{position:fixed!important;top:0;left:0;bottom:0;width:300px;max-width:88vw;z-index:500;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}
          .sdbk.mob-open{transform:translateX(0)!important;box-shadow:4px 0 40px rgba(0,0,0,.7)!important}
          .g4{grid-template-columns:1fr 1fr}
          .g3{grid-template-columns:1fr 1fr}
          .hm{display:none!important}
          .mob-params-btn{display:inline-flex!important}
          .mob-close-btn{display:flex!important}
          .ls{min-height:44px}
        }
        @media(max-width:480px){
          .g2{grid-template-columns:1fr}
          .g3{grid-template-columns:1fr}
          .si-badge{display:none!important}
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background:"#0a0f1e", borderBottom:"1px solid #1e2d47", padding:"0 20px", height:54, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#eab308,#ca8a04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#0a0f1e" }}>L</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#eab308", letterSpacing:".04em", lineHeight:1 }}>Lunarae</div>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:".12em", textTransform:"uppercase", lineHeight:1.2 }}>BOE Intelligence</div>
          </div>
        </div>
        <div style={{ flex:1 }}/>
        {result && (
          <>
            <button className="lb lx hm" onClick={()=>{setXmlLoading(true);try{downloadXml(result,rbzRate)}finally{setXmlLoading(false)}}} disabled={xmlLoading} style={{ fontSize:11, padding:"7px 13px" }}>
              {xmlLoading?"…":"↓"} ASYCUDA XML
            </button>
          </>
        )}
        <div className="si-badge" style={{ background:"rgba(234,179,8,.1)", border:"1px solid rgba(234,179,8,.25)", borderRadius:20, padding:"4px 12px", fontSize:10, color:"#eab308", letterSpacing:".06em", whiteSpace:"nowrap" }}>
          SI 122 · SI 35/2024 · {Object.keys(HS_KNOWLEDGE).length} HS codes
        </div>
      </nav>

      {/* Mobile overlay backdrop */}
      {mobParams && (
        <div onClick={()=>setMobParams(false)} style={{ position:"fixed", inset:0, zIndex:490, background:"rgba(0,6,20,.65)", backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)" }}/>
      )}

      {/* Layout */}
      <div className="mlayout" style={{ display:"grid", gridTemplateColumns:"300px 1fr", flex:1, minHeight:0 }}>

        {/* Sidebar */}
        <aside className={`sdbk${mobParams?" mob-open":""}`} style={{ background:"#0a0f1e", borderRight:"1px solid #1e2d47", padding:"20px 16px", overflowY:"auto", display:"flex", flexDirection:"column", gap:18 }}>
          {/* Mobile close button */}
          <div className="mob-close-btn" style={{ justifyContent:"flex-end", marginBottom:2, marginTop:-4 }}>
            <button onClick={()=>setMobParams(false)} style={{ background:"none", border:"1px solid #1e2d47", borderRadius:8, color:"#94a3b8", fontSize:16, lineHeight:1, padding:"4px 10px", cursor:"pointer" }}>✕</button>
          </div>
          {/* Parameters */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#eab308", marginBottom:12 }}>Entry Parameters</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[["Entry Type",["Home Consumption","Transit","Warehousing","Temporary Import","Export"],entryType,setEntryType],
                ["Mode of Transport",["Road","Air","Sea","Rail"],transport,setTransport],
                ["Port of Entry",["Beitbridge","Forbes (Mutare)","Chirundu","Plumtree","Victoria Falls","Harare Airport","Bulawayo Airport","Joshua Nkomo Airport"],portEntry,setPortEntry],
              ].map(([label,opts,val,set])=>(
                <div key={label}>
                  <label style={{ display:"block", fontSize:10, color:"#475569", letterSpacing:".07em", textTransform:"uppercase", marginBottom:5 }}>{label}</label>
                  <select className="ls" value={val} onChange={e=>set(e.target.value)}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ display:"block", fontSize:10, color:"#475569", letterSpacing:".07em", textTransform:"uppercase", marginBottom:5 }}>RBZ Rate (ZWG/USD)</label>
                <input className="ls" type="number" step="0.01" value={rbzRate} onChange={e=>setRbzRate(e.target.value)} placeholder="13.50"/>
              </div>
            </div>
          </div>

          <hr className="hz"/>

          {/* Documents */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#eab308", marginBottom:12 }}>Shipping Documents</div>
            <div className={`dz ${dragging?"drag":""}`} onClick={()=>fileRef.current.click()}
              onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.xml" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
              <div style={{ fontSize:24, marginBottom:6 }}>📄</div>
              {fileName
                ? <div style={{ fontSize:12, color:"#eab308", fontWeight:500 }}>
                    {fileLoading ? <><span className="spin" style={{ width:10,height:10,border:"2px solid rgba(234,179,8,.3)",borderTop:"2px solid #eab308",borderRadius:"50%",display:"inline-block",marginRight:6 }}/>Reading…</> : `✓ ${fileName}`}
                  </div>
                : <>
                    <div style={{ fontSize:11.5, color:"#475569" }}>Drop invoice or packing list</div>
                    <div style={{ fontSize:10, color:"#eab308", marginTop:4 }}>PDF · TXT · CSV · XML</div>
                  </>
              }
              {fileWarning && <div style={{ marginTop:8, fontSize:10, color:"#f59e0b", background:"rgba(245,158,11,.1)", borderRadius:6, padding:"6px 10px", textAlign:"left" }}>⚠ {fileWarning}</div>}
            </div>
            <div style={{ fontSize:10, color:"#334155", margin:"8px 0 6px", textAlign:"center" }}>— or paste text —</div>
            <textarea className="tdoc" value={docText} onChange={e=>setDocText(e.target.value)} placeholder="Paste invoice / packing list text…"/>
            <div style={{ display:"flex", gap:7, marginTop:8 }}>
              <button className="lb lg2" style={{ flex:1, fontSize:11 }} onClick={()=>setDocText("")}>Clear</button>
            </div>
          </div>

          <hr className="hz"/>

          {onNavigate && (
            <button className="lb lg2" style={{ width:"100%", justifyContent:"center", padding:"10px", marginBottom:4 }}
              onClick={()=>onNavigate("zimra")}>Go to Zimra BOE Viewer →</button>
          )}

          <button className="lb lp" style={{ width:"100%", justifyContent:"center", padding:"13px" }}
            onClick={run} disabled={loading||!docText.trim()}>
            {loading
              ? <><span className="spin" style={{ width:14,height:14,border:"2px solid rgba(10,15,30,.3)",borderTop:"2px solid #0a0f1e",borderRadius:"50%",display:"inline-block" }}/> Processing…</>
              : <><span style={{ fontSize:16 }}>⚡</span> Generate BOE Analysis</>
            }
          </button>

          {/* KB stats */}
          <div style={{ background:"#0d1525", border:"1px solid #1e2d47", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:"#eab308", fontWeight:700, marginBottom:6, letterSpacing:".08em" }}>KNOWLEDGE BASE</div>
            <div style={{ fontSize:11, color:"#64748b", lineHeight:1.7 }}>
              <div>📦 {Object.keys(HS_KNOWLEDGE).length} HS codes trained</div>
              <div>🔒 CBCA flags for all cosmetics/electronics</div>
              <div>💊 MCAZ licence for medical goods</div>
              <div>🔋 Battery licence (Ch 85.06/85.07)</div>
              <div>📏 Auto-chunking for 549+ item invoices</div>
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <main style={{ padding:"20px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <button className="lb lg2 mob-params-btn" onClick={()=>setMobParams(true)} style={{ fontSize:11, padding:"8px 13px", borderRadius:8 }}>⚙ Parameters</button>
            <button className={`tab ${view==="input"?"on":""}`} onClick={()=>setView("input")}>Input</button>
            <button className={`tab ${view==="results"?"on":""}`} onClick={()=>setView("results")} disabled={!result&&!loading}>
              {loading ? "Processing…" : result ? `BOE Results (${result.line_items?.length||0} items)` : "BOE Results"}
            </button>
            {result && (
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                <span className="dot" style={{ background:readyColor, boxShadow:`0 0 6px ${readyColor}` }}/>
                <span style={{ color:readyColor }}>{result.ready_to_register?"Ready to register":"Action required"}</span>
              </div>
            )}
          </div>

          {/* Welcome */}
          {view==="input" && !loading && (
            <div className="fadeup" style={{ textAlign:"center", padding:"48px 20px" }}>
              <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#eab308,#ca8a04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 20px", boxShadow:"0 0 32px rgba(234,179,8,.25)" }}>⚖</div>
              <h1 style={{ fontSize:22, fontWeight:700, color:"#f8fafc", marginBottom:8 }}>Lunarae BOE Intelligence</h1>
              <p style={{ fontSize:14, color:"#64748b", maxWidth:480, margin:"0 auto 28px", lineHeight:1.8 }}>
                Upload your invoice. Lunarae's Zimbabwe HS knowledge base auto-applies CBCA flags, import licence requirements, duty rates and VAT — then generates a ZIMRA-ready Bill of Entry with ASYCUDA XML.
              </p>
              <div className="g3" style={{ maxWidth:520, margin:"0 auto" }}>
                {[
                  ["📦","549+ HS Codes","Pre-trained with EDA HOME invoice data + Zimbabwe Tariff Book"],
                  ["🔒","CBCA Smart Flags","Automatically applies SI 35/2024 CBCA to all applicable items"],
                  ["⚡","Auto-Chunking","Splits 500+ item invoices into batches to avoid token limits"],
                ].map(([icon,title,desc])=>(
                  <div key={title} className="lsm">
                    <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0", marginBottom:4 }}>{title}</div>
                    <div style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px" }}>
              <div style={{ position:"relative", width:56, height:56, marginBottom:24 }}>
                <div className="spin" style={{ position:"absolute", inset:0, border:"3px solid #1e2d47", borderTop:"3px solid #eab308", borderRadius:"50%" }}/>
                <div style={{ position:"absolute", inset:8, borderRadius:"50%", background:"linear-gradient(135deg,#eab308,#ca8a04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚖</div>
              </div>
              <div style={{ fontSize:16, fontWeight:600, color:"#f8fafc", marginBottom:6 }}>Processing your documents</div>
              <div className="pulse" style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>{stages[stageIdx]}</div>
              {progress && <div style={{ fontSize:11, color:"#eab308", marginBottom:16, fontFamily:"monospace" }}>{progress}</div>}
              <div style={{ display:"flex", gap:5 }}>
                {stages.map((_,i)=>(
                  <div key={i} style={{ width:i<=stageIdx?20:6, height:6, borderRadius:3, background:i<=stageIdx?"#eab308":"#1e2d47", transition:"all .3s" }}/>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background:"#1a0808", border:"1px solid #7f1d1d", borderRadius:12, padding:"14px 18px", color:"#fca5a5", fontSize:13 }}>
              ⚠ {error}
              <div style={{ fontSize:11, color:"#ef4444", marginTop:6 }}>
                Tip: If this is a large invoice (500+ items), the AI call may have timed out. Try pasting a smaller portion of the invoice, or use the batch processing mode.
              </div>
            </div>
          )}

          {/* Results */}
          {result && view==="results" && !loading && (
            <div className="fadeup" style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Summary header */}
              <div className="lcard">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#eab308" }}>Bill of Entry — {result.entry_type}</div>
                  <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                    <button className="lb lx" onClick={()=>{setXmlLoading(true);try{downloadXml(result,rbzRate)}finally{setXmlLoading(false)}}} disabled={xmlLoading} style={{ fontSize:11, padding:"6px 12px" }}>
                      {xmlLoading?"…":"↓"} ASYCUDA XML
                    </button>
                  </div>
                </div>
                <div className="g4">
                  {[["Importer",result.importer],["Exporter",result.exporter],["Origin",result.country_of_origin],["Port",result.port_of_entry]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{ fontSize:9, color:"#475569", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>{k}</div>
                      <div style={{ fontSize:12, fontWeight:500, color:"#e2e8f0" }}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance alerts */}
              {result.compliance_alerts?.length > 0 && (
                <div className="lcard">
                  <div style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                    🚨 Compliance Alerts
                    <span style={{ background:"#7f1d1d", color:"#fca5a5", fontSize:11, borderRadius:20, padding:"1px 8px" }}>{result.compliance_alerts.length}</span>
                  </div>
                  {result.compliance_alerts.map((a,i)=>{
                    const ac = ALERT_MAP[a.severity]||ALERT_MAP.INFO;
                    return (
                      <div key={i} style={{ background:ac.bg, border:`1px solid ${ac.border}`, borderLeft:`4px solid ${ac.color}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                        <div style={{ display:"flex", gap:8 }}>
                          <span style={{ fontSize:14 }}>{ac.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:12, color:ac.color, marginBottom:3 }}>{a.item}</div>
                            <div style={{ fontSize:11.5, color:"#374151", marginBottom:5 }}>{a.alert}</div>
                            <div style={{ fontSize:11, fontWeight:600, color:ac.color }}>→ {a.action_required}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CBCA/Licence summary */}
              {result.line_items?.length > 0 && (() => {
                const cbca = result.line_items.filter(i=>i.cbca_required||i.compliance_status?.includes("CBCA")).length;
                const lic  = result.line_items.filter(i=>i.import_licence_required||i.compliance_status?.includes("LICENCE")).length;
                const clear = result.line_items.filter(i=>i.compliance_status==="CLEAR").length;
                return (
                  <div className="g3">
                    {[[cbca,"CBCA Required","#a16207","#fef9c3"],
                      [lic,"Licence Required","#c2410c","#fff7ed"],
                      [clear,"Clear","#15803d","#dcfce7"]].map(([cnt,lbl,col,bg])=>(
                      <div key={lbl} style={{ background:bg, border:`1px solid ${col}20`, borderRadius:12, padding:"16px", textAlign:"center" }}>
                        <div style={{ fontSize:24, fontWeight:700, color:col }}>{cnt}</div>
                        <div style={{ fontSize:10, color:col, textTransform:"uppercase", letterSpacing:".08em", marginTop:4 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Duty summary */}
              {result.totals && (
                <div className="lcard">
                  <div style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:14 }}>💰 Duty Summary</div>
                  <div className="g3">
                    {[["Total CIF",fmtUSD(result.totals.total_cif_usd)],
                      ["Customs Duty",fmtUSD(result.totals.total_customs_duty_usd)],
                      ["VAT 14.5%",fmtUSD(result.totals.total_vat_usd)]].map(([l,v])=>(
                      <div key={l} className="stat">
                        <div style={{ fontSize:18, fontWeight:700, color:"#eab308", marginBottom:4 }}>{v}</div>
                        <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:".1em" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, padding:"14px 16px", background:"#080d18", borderRadius:10, border:"1px solid #1e2d47", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#475569", marginBottom:3 }}>Total Duty Payable</div>
                      <div style={{ fontSize:22, fontWeight:700, color:"#eab308" }}>{fmtUSD(result.totals.total_duty_payable_usd)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:"#475569", marginBottom:3 }}>ZWG @ {rbzRate}</div>
                      <div style={{ fontSize:18, fontWeight:600, color:"#94a3b8" }}>
                        ZWG {Number(result.totals.total_duty_payable_zwg||0).toLocaleString("en",{maximumFractionDigits:2})}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line items table */}
              {result.line_items?.length > 0 && (
                <div className="lcard" style={{ padding:0, overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #1e2d47", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#f8fafc" }}>📦 Line Items</span>
                    <span style={{ background:"#0f1729", color:"#64748b", border:"1px solid #1e2d47", borderRadius:20, padding:"1px 8px", fontSize:11 }}>{result.line_items.length}</span>
                    <span style={{ fontSize:10, color:"#334155", marginLeft:4 }}>enriched with Zimbabwe HS knowledge base</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                      <thead>
                        <tr style={{ background:"#080d18" }}>
                          {["#","Description","HS Code","Qty","CIF","Duty%","Duty","VAT","Total","CBCA","Lic","Status","Conf","Review"].map(h=>(
                            <th key={h} style={{ textAlign:"left", padding:"10px 10px", color:"#475569", fontSize:9, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", borderBottom:"1px solid #1e2d47", whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.line_items.map((item,i)=>{
                          const st = STATUS_MAP[item.compliance_status]||STATUS_MAP.CLEAR;
                          return (
                            <tr key={i} className="irow" style={{ background:i%2===0?"rgba(13,21,37,.8)":"transparent", borderBottom:"1px solid #0f1729" }}>
                              <td style={{ padding:"8px 10px", color:"#64748b", fontFamily:"monospace", fontSize:10 }}>{item.line_no}</td>
                              <td style={{ padding:"8px 10px", maxWidth:180 }}>
                                <div style={{ fontWeight:500, color:"#e2e8f0", fontSize:11 }}>{item.description}</div>
                                {item.permit_notes && <div style={{ fontSize:9, color:"#f59e0b", marginTop:2 }}>⚠ {item.permit_notes}</div>}
                              </td>
                              <td style={{ padding:"8px 10px", fontFamily:"monospace", color:"#94a3b8", fontSize:10, whiteSpace:"nowrap" }}>{item.hs_code}</td>
                              <td style={{ padding:"8px 10px", color:"#94a3b8", whiteSpace:"nowrap", fontSize:10 }}>{item.quantity}</td>
                              <td style={{ padding:"8px 10px", color:"#cbd5e1", whiteSpace:"nowrap", fontSize:10 }}>{fmtUSD(item.cif_value_usd)}</td>
                              <td style={{ padding:"8px 10px", color:"#94a3b8", textAlign:"center", fontSize:10 }}>{fmtPct(item.duty_rate)}</td>
                              <td style={{ padding:"8px 10px", color:"#cbd5e1", whiteSpace:"nowrap", fontSize:10 }}>{fmtUSD(item.customs_duty_usd)}</td>
                              <td style={{ padding:"8px 10px", color:"#cbd5e1", whiteSpace:"nowrap", fontSize:10 }}>{fmtUSD(item.vat_usd)}</td>
                              <td style={{ padding:"8px 10px", fontWeight:600, color:"#eab308", whiteSpace:"nowrap", fontSize:10 }}>{fmtUSD(item.total_duty_usd)}</td>
                              <td style={{ padding:"8px 10px", textAlign:"center" }}>
                                {(item.cbca_required||item.compliance_status?.includes("CBCA"))
                                  ? <span style={{ color:"#a16207", fontSize:14 }}>✓</span>
                                  : <span style={{ color:"#334155", fontSize:11 }}>—</span>}
                              </td>
                              <td style={{ padding:"8px 10px", textAlign:"center" }}>
                                {item.import_licence_required
                                  ? <span style={{ color:"#c2410c", fontSize:14 }}>✓</span>
                                  : <span style={{ color:"#334155", fontSize:11 }}>—</span>}
                              </td>
                              <td style={{ padding:"8px 10px" }}>
                                <span style={{ background:st.bg, color:st.color, fontSize:9, fontWeight:600, borderRadius:20, padding:"2px 7px", display:"inline-flex", alignItems:"center", gap:3, whiteSpace:"nowrap" }}>
                                  <span className="dot" style={{ width:4, height:4, background:st.dot }}/>
                                  {item.compliance_status}
                                </span>
                              </td>
                              <td style={{ padding:"8px 10px", whiteSpace:"nowrap" }}>
                                {(() => {
                                  const conf = item.confidence ?? 70;
                                  const cc = conf >= 95 ? "#4ade80" : conf >= 80 ? "#e9ba4c" : "#f87171";
                                  return (
                                    <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:700, background:cc+"18", color:cc, border:`1px solid ${cc}35` }}>
                                      <span style={{ width:4, height:4, borderRadius:"50%", background:cc, flexShrink:0 }} />
                                      {conf}%
                                    </span>
                                  );
                                })()}
                              </td>
                              <td style={{ padding:"8px 10px" }}>
                                <button
                                  onClick={() => setReviewItem(item)}
                                  style={{ background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.3)", borderRadius:6, padding:"3px 8px", fontSize:9, fontWeight:600, color:"#60a5fa", cursor:"pointer", whiteSpace:"nowrap" }}
                                  onMouseEnter={e=>{ e.currentTarget.style.background="rgba(96,165,250,0.2)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.5)" }}
                                  onMouseLeave={e=>{ e.currentTarget.style.background="rgba(96,165,250,0.1)"; e.currentTarget.style.borderColor="rgba(96,165,250,0.3)" }}
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {result.boe_notes && (
                <div className="lcard" style={{ borderColor:"rgba(234,179,8,.2)" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#eab308", marginBottom:8 }}>📝 Notes</div>
                  <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8 }}>{result.boe_notes}</div>
                </div>
              )}

              {/* Export */}
              <div className="lcard" style={{ textAlign:"center", padding:24 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:6 }}>Export Documents</div>
                <div style={{ fontSize:12, color:"#475569", marginBottom:18 }}>Download your completed BOE for ZIMRA submission</div>
                <button className="lb lx" onClick={()=>{setXmlLoading(true);try{downloadXml(result,rbzRate)}finally{setXmlLoading(false)}}} disabled={xmlLoading} style={{ minWidth:200 }}>
                  {xmlLoading ? <span className="spin" style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",display:"inline-block" }}/> : "📂"}
                  Download ASYCUDA XML
                </button>
                <div style={{ marginTop:12, fontSize:10, color:"#334155" }}>
                  XML formatted for ZIMRA ASYCUDA World · {result.line_items?.length||0} line items · {Object.keys(HS_KNOWLEDGE).length} HS codes in knowledge base
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

    {reviewItem && (
      <ClassificationReviewModal
        item={reviewItem}
        userFullName={user?.full_name || ""}
        onClose={() => setReviewItem(null)}
      />
    )}
    </>
  );
}