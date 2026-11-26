const words=value=>value.replace(/^v_/, '').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const entry=(label,description,unit=null)=>({label,description,unit,descriptionSource:'StarPanel reference notes'});
const outputRows={};
function group(prefix,rows){for(const [key,label,description,unit]of rows)outputRows[prefix+key]=entry(label,description,unit);}
group('header.',[
 ['sequence','Frame sequence','Sequence number attached to a telemetry frame.'],
 ['game_time_unix_ms','Frame timestamp','Game-provided Unix timestamp for this frame.','ms']
]);
group('vehicle.state.',[
 ['name','Vehicle instance name','Reported name of the current vehicle instance; may contain an identifying suffix.'],
 ['class_name','Vehicle model code','Internal class/model identifier for the current vehicle.'],
 ['manufacturer','Vehicle manufacturer','Manufacturer identifier reported for the vehicle.'],
 ['type','Vehicle type','Vehicle category, such as spaceship or ground vehicle, as an enum.'],
 ['lights_enabled','Exterior lights','Reports whether the vehicle exterior lights are enabled.'],
 ['doors.open_state','Door position','Aggregate door-position enum, distinguishing reported opened and closed states.'],
 ['doors.lock_state','Door lock state','Aggregate door locking state reported by the vehicle.'],
 ['shields.level','Shield level','Overall shield level; upstream treats this as a normalized fraction when received.'],
 ['shields.faces','Shield face levels','Array of shield-face levels. Face ordering must be verified for the ship.'],
 ['health','Hull health','Vehicle health value; upstream treats this as a normalized hull-health fraction when received.'],
 ['master_mode.mode','Master mode','Reported master-mode enum, including SCM or NAV on supported builds.'],
 ['master_mode.spooled','Master-mode spool flag','Reports the master-mode spooled flag. Exact transition semantics depend on the build.'],
 ['quantum_travel.state','Quantum travel state','Quantum-drive/travel state as an enum.'],
 ['quantum_travel.spool_ratio','Quantum spool progress','Reported quantum-drive spooling progress ratio.'],
 ['quantum_travel.calibration_ratio','Quantum calibration progress','Reported destination calibration progress ratio.'],
 ['quantum_travel.destination.id','Quantum destination ID','Internal identifier of the selected quantum destination.'],
 ['quantum_travel.destination.display_name','Quantum destination name','Display name of the selected quantum destination.'],
 ['quantum_travel.eta_seconds','Quantum arrival estimate','Estimated remaining quantum-travel time, when supplied.','s'],
 ['quantum_travel.remaining_distance_m','Quantum distance remaining','Remaining distance to the quantum destination, when supplied.','m']
]);
group('vehicle.state.flight.state.',[
 ['is_landed','Landed state','Reports whether the flight system considers the vehicle landed.'],
 ['gear','Landing gear position','Landing gear deployment enum: retracted, deploying, deployed or retracting.'],
 ['vtol','VTOL position','VTOL deployment state, including movement when reported.'],
 ['transformation','Ship transformation position','Deployment state of the ship transformation mechanism.']
]);
group('vehicle.state.flight.instruments.',[
 ['speed','Flight speed','Flight instrument speed reported by the game.','m/s'],
 ['hydrogen_fuel','Hydrogen fuel','Reported hydrogen fuel fraction; some ships do not supply it.'],
 ['quantum_fuel','Quantum fuel','Reported quantum fuel value. Availability/presence differs by build; do not invent a missing value.'],
 ['g_meter.current','Current G-force','Current G-meter reading.','G'],
 ['g_meter.max','Peak G-force','Recorded peak G-meter reading, not the ship or pilot G limit.','G'],
 ['boost.engaged','Boost engaged','Reports whether thruster boost is engaged.'],
 ['boost.output','Boost output','Reported boost-output value; verify scale before using it as a percentage.'],
 ['boost.reserves','Boost reserve','Remaining boost reserve; upstream uses a normalized fraction when supplied.'],
 ['boost.critical','Boost reserve critical','Reports the boost system critical-reserve flag.'],
 ['altitude','Altitude','Altitude instrument reading; datum depends on game context and unavailable sentinels are rejected.','m'],
 ['radar_altitude','Radar altitude','Radar altitude/height instrument reading, when the surface is within range.','m'],
 ['vertical_speed_indicator','Vertical speed','Vertical flight speed; positive indicates climbing in the upstream reader.','m/s'],
 ['atmospheric_density','Atmospheric density','Reported local atmospheric-density value; scale/units need build-specific verification.'],
 ['heading','Heading','Reported flight heading. Verify its scale and reference before driving a compass.']
]);
group('vehicle.state.flight.settings.',[
 ['ifcs_spacebreak_enables_boost','Space brake uses boost','Reports whether the space-brake setting enables boost. The schema spells this field spacebreak.'],
 ['advanced_hud_enabled_scm','Advanced HUD in SCM','Reports the advanced-HUD setting for SCM mode.'],
 ['advanced_hud_enabled_nav','Advanced HUD in NAV','Reports the advanced-HUD setting for NAV mode.'],
 ['advanced_hud_labels','Advanced HUD labels','Reports the HUD-label setting.'],
 ['course_prediction','Course prediction','Reports the course-prediction display setting.'],
 ['ifcs_g_safe_disabled_by_boost','Boost disables G-safe','Reports whether boost is configured to disable G-safe.'],
 ['flight_light_amplification','Flight night vision','Reports the flight light-amplification/night-vision setting.']
]);
group('weapons.',[
 ['preset_index','Weapon group number','Index of the active weapon preset/group.'],
 ['preset_name','Weapon group name','Name of the active weapon preset/group, when supplied.'],
 ['weapons','Individual weapons','Collection of weapon entries, including power/readiness data. Requires per-entry parsing.'],
 ['countermeasures','Countermeasure stock','Collection of countermeasure types and remaining amounts; a true maximum stock is not supplied.']
]);
group('weapons.settings.',[
 ['fallback_convergence_distance','Fallback convergence setting','Reported fallback-convergence flag. Exact behavior is not established by the field name alone.'],
 ['magnified_ui','Magnified weapon UI','Reports the magnified-UI setting.'],
 ['precision_lines','Precision aiming lines','Reports whether precision aiming lines are enabled.'],
 ['staggered_fire','Staggered firing','Reports the staggered-fire setting.'],
 ['use_lag_pips','Lag aiming pips','Reports whether lag aiming indicators are selected.'],
 ['use_single_pips','Single aiming pip','Reports the single-pip aiming display setting.'],
 ['use_fading_pips','Fading aiming pips','Reports the fading-pip aiming display setting.'],
 ['gimbals_locked','Weapon gimbals locked','Reports the weapon-gimbal lock setting.']
]);
group('actor.vitals.',[
 ['heart_rate','Heart rate','Reported character heart rate; verify scale against the game display.'],
 ['gravity','Local gravity','Reported gravity value affecting the character; units are not assumed.'],
 ['pressure','Local pressure','Reported pressure around the character; units are not assumed.'],
 ['intoxication_level','Intoxication level','Reported character intoxication level.']
]);
group('actor.state.',[
 ['locomotion','Character movement state','Character locomotion enum, such as on foot, seated or EVA.'],
 ['crew_role','Crew role','Reported role in the current vehicle/crew context.'],
 ['seat_name','Seat name','Reported name of the occupied seat, when seated.'],
 ['uec_balance','Account balance','Reported in-game currency balance. Treat captures as private gameplay data.'],
 ['operator_mode','Operator mode','Reported seat/operator mode, such as flight or another vehicle tool mode.'],
 ['location.hierarchy','Location hierarchy','Collection of named locations containing the character; requires per-entry formatting.'],
 ['location.jurisdiction.id','Jurisdiction ID','Internal identifier for the current jurisdiction.'],
 ['location.jurisdiction.display_name','Jurisdiction name','Display name of the current jurisdiction.'],
 ['location.armistice_zone','Armistice zone','Reports whether the character is in an armistice zone.'],
 ['tracked_contract.revision','Tracked contract revision','Revision counter for tracked-contract data; not an objective progress count.'],
 ['tracked_contract.details.contract_id','Tracked contract ID','Internal identifier for the currently tracked contract.'],
 ['tracked_contract.details.title','Tracked contract title','Display title of the currently tracked contract.'],
 ['tracked_contract.details.giver_name','Contract giver','Name of the giver of the currently tracked contract.'],
 ['tracked_contract.details.current_objective.text','Current objective','Text describing the currently tracked objective.'],
 ['tracked_contract.details.objectives_completed','Objectives completed','Reported count of completed objectives in the tracked contract.'],
 ['tracked_contract.details.objectives_total','Total objectives','Reported total objective count for the tracked contract.'],
 ['tracked_contract.details.ends_at_unix_ms','Contract deadline','Contract end/deadline as a Unix timestamp, when provided.','ms'],
 ['crime_stat','CrimeStat','Reported character CrimeStat level.'],
 ['player_name','Player name','Reported player name; exclude actual values from public recordings.']
]);
group('actor.environment.',[
 ['external_temperature','Outside temperature','Reported environmental temperature; use game/build documentation to confirm units.'],
 ['ambient_radiation_rate','Ambient radiation rate','Reported environmental radiation rate; units/scale are not assumed.'],
 ['breathable_atmosphere','Breathable atmosphere','Reports whether the surrounding atmosphere is breathable.']
]);
group('game.',[
 ['state','Game state','Reported game/session state as an enum.'],
 ['menu_open','Menu open','Reports whether the game menu is open.'],
 ['game_mode','Game mode','Reported game-mode identifier.']
]);
group('game.debug.',[
 ['fps','Client frame rate','Reported client frame rate.','frames/s'],
 ['frame_time_ms','Client frame time','Reported client frame duration.','ms'],
 ['main_thread_ms','Main thread time','Reported main-thread timing.','ms'],
 ['render_thread_ms','Render thread time','Reported render-thread timing.','ms'],
 ['gpu_ms','GPU time','Reported GPU timing, when supplied.','ms'],
 ['vram.used_mb','VRAM used','Reported video-memory usage.','MB'],
 ['vram.budget_mb','VRAM budget','Reported video-memory budget.','MB'],
 ['network.ping_ms','Network ping','Reported network round-trip/ping timing.','ms'],
 ['network.packet_loss_percent','Packet loss','Reported network packet-loss percentage.','%'],
 ['network.bits_per_second_in','Incoming network rate','Reported incoming network data rate.','bit/s'],
 ['network.bits_per_second_out','Outgoing network rate','Reported outgoing network data rate.','bit/s'],
 ['server.fps','Server frame rate','Reported server frame rate.','frames/s'],
 ['server.min_frame_time_ms','Server minimum frame time','Reported minimum server frame duration.','ms'],
 ['server.max_frame_time_ms','Server maximum frame time','Reported maximum server frame duration.','ms'],
 ['server.hitch_count','Server hitch count','Reported count of server frame hitches.'],
 ['universe_time_unix_ms','Universe timestamp','Reported universe time as a Unix timestamp.','ms'],
 ['shard_id','Shard ID','Reported server shard identifier; may identify the current session.'],
 ['shard_name','Shard name','Reported server shard name; treat captures as session data.']
]);
const assists={ifcs_coupled:'Coupled flight',ifcs_esp:'Enhanced Stick Precision (ESP)',ifcs_gravity_compensation:'Gravity compensation',ifcs_g_safe:'G-force safety',ifcs_cruise_mode:'Cruise control',ifcs_speed_limiter:'Speed limiter',ifcs_proximity_assist:'Proximity assist',ifcs_proximity_assist_landing:'Landing proximity assist',ifcs_stability:'Flight stability assist',ifcs_core:'Core flight control',ifcs_wind_compensation:'Wind compensation',ifcs_command_behaviour:'Flight command behaviour'};
const power={powerplants:'Powerplants',engines:'Engines',weapons:'Weapons',coolers:'Coolers',life_support:'Life support',gravity_generators:'Gravity generators',sensors:'Sensors',shield_generators:'Shield generators',shield_emitters:'Shield emitters'};
const annunciators={pwr:'Power',wpn:'Weapons',thr:'Thrusters',shld:'Shields',cool:'Cooling',qdrv:'Quantum drive',radr:'Radar',prox:'Proximity',hit:'Hit',misl:'Missile'};
export function describeOutput(path){
 if(outputRows[path])return outputRows[path];
 let match=path.match(/^actor\.vitals\.(health|oxygen|hunger|thirst|body_temperature)\.(current|max)$/);
 if(match){const label=words(match[1]);return entry(`${label} — ${match[2]==='max'?'maximum':'current'}`,`Reported ${match[2]==='max'?'maximum/reference':'current'} ${label.toLowerCase()} gauge value. Use the paired gauge values; do not assume every gauge is a percentage.`);}
 match=path.match(/^vehicle\.state\.flight\.settings\.([^.]+)\.(enabled|active)$/);
 if(match&&assists[match[1]])return entry(`${assists[match[1]]} — ${match[2]}`,match[2]==='active'?`Reports whether ${assists[match[1]].toLowerCase()} is active.`:`Reported enabled/availability flag for ${assists[match[1]].toLowerCase()}. Distinct from its active state; an absent subsystem remains unavailable.`);
 match=path.match(/^vehicle\.state\.power\.([^.]+)$/);if(match&&power[match[1]])return entry(`${power[match[1]]} power`,`Reports the power-enabled flag for ${power[match[1]].toLowerCase()}; it is not a power allocation percentage.`);
 match=path.match(/^vehicle\.state\.annunciators\.([^.]+)$/);if(match&&annunciators[match[1]])return entry(`${annunciators[match[1]]} warning light`,`Reported ${annunciators[match[1]].toLowerCase()} annunciator state. Enum values distinguish nominal/off and minor/major flashing or steady warnings.`);
 match=path.match(/^force_feedback\.(angular|linear)\.([xyz])\.(resistance|damping)$/);if(match)return entry(`${words(match[1])} ${match[2].toUpperCase()} ${match[3]}`,`Reported haptic ${match[3]} on the ${match[1]} ${match[2].toUpperCase()} axis. This is force-feedback data, not a world position or attitude angle.`);
 if(path==='force_feedback.gunfire')return entry('Gunfire haptic effect','Reported gunfire force-feedback effect value; not a weapon firing command.');
 if(path==='force_feedback.stick_shaker')return entry('Stick shaker effect','Reported stick-shaker force-feedback effect value.');
 if(path==='turret.light_amplification')return entry('Turret night vision','Reports the turret light-amplification/night-vision flag.');
 if(path==='events.events')return entry('Game event collection','Collection of telemetry events. A defined event is not guaranteed to be emitted by this build.');
 return {label:words(path.split('.').at(-1)),description:'Additional schema field. Its detailed meaning and units have not yet been reviewed.',unit:null,descriptionSource:'Unreviewed schema name'};
}

const inputRows={
 mobiglas:['mobiGlas','Requests the mobiGlas interface action.'],toggle_flashlight:['Flashlight toggle','Toggles the character flashlight. Its current on/off state is not exposed in this reference.'],v_starmap:['Star map','Requests the star-map interface action.'],visor_wipe:['Wipe visor','Requests the character visor-wipe action.'],
 v_eject:['Eject','Requests ejection from a supported seat. Potentially irreversible; check the intended seat/action before assigning.'],v_emergency_exit:['Emergency exit','Requests the current seat or vehicle emergency-exit action.'],v_self_destruct:['Self-destruct','Requests the ship self-destruct action. This is a destructive control, not a status readout.'],
 v_operator_mode_cycle_back:['Previous operator mode','Cycles backward through available seat/operator modes.'],v_operator_mode_cycle_forward:['Next operator mode','Cycles forward through available seat/operator modes.'],
 v_toggle_docking_request:['Docking request','Toggles a docking request in a supported docking context.'],v_flightready:['Flight ready','Requests the ship flight-ready action; resulting subsystem changes depend on the ship/context.'],v_atc_request:['Request ATC','Sends the available air-traffic-control request action.'],
 v_ifcs_reset_gmeter_max:['Reset peak G-force','Resets the recorded maximum G-meter reading.'],v_ifcs_toggle_esp:['Toggle ESP','Toggles Enhanced Stick Precision flight assistance.'],v_ifcs_toggle_gforce_safety:['Toggle G-safe','Toggles G-force safety assistance.'],
 v_deploy_landing_system:['Deploy landing gear','Requests landing gear deployment.'],v_retract_landing_system:['Retract landing gear','Requests landing gear retraction.'],v_toggle_landing_system:['Toggle landing gear','Changes landing gear deployment state; inspect feedback before using a maintained switch.'],
 v_master_mode_set_nav:['Select NAV master mode','Requests navigation master mode.'],v_master_mode_set_scm:['Select SCM master mode','Requests SCM master mode.'],v_master_mode_cycle:['Cycle master mode','Cycles the ship master mode.'],
 v_transform_deploy:['Deploy ship transformation','Requests deployment of the ship transformation mechanism.'],v_transform_retract:['Retract ship transformation','Requests retraction of the ship transformation mechanism.'],v_transform_cycle:['Cycle ship transformation','Cycles the ship transformation mechanism.'],
 v_toggle_qdrive_engagement:['Quantum drive engagement','Toggles quantum-drive engagement when the game allows it.'],v_invoke_ping:['Radar ping','Requests a radar/scanning ping.'],v_target_hail:['Hail target','Requests a hail to the current eligible target.']
};
const inputFamilies=[['v_lights','Exterior lights'],['v_light_amplification','Night vision'],['v_flight_advanced_hud','Advanced flight HUD'],['v_ifcs_gsafe','G-force safety'],['v_ifcs_proximity_assist','Proximity assist'],['v_ifcs_vector_decoupling','Decoupled flight'],['v_vtol','VTOL']];
export function describeInput(key){
 if(inputRows[key])return entry(...inputRows[key]);
 if(key.startsWith('emote_')){const name=key.slice(6)==='atease'?'At ease':words(key.slice(6));return entry(`Emote: ${name}`,`Requests the character's ${name.toLowerCase()} emote in an allowed context.`);}
 let m=key.match(/^v_enter_remote_turret_([123])$/);if(m)return entry(`Enter remote turret ${m[1]}`,`Requests control of remote turret slot ${m[1]} when the current seat/vehicle supports it.`);
 m=key.match(/^v_set_(flight|guns|mining|quantum|refuel|salvage|scan)_mode$/);if(m)return entry(`Select ${m[1]} operator mode`,`Requests the ${m[1]} seat/operator mode. Availability depends on the ship and seat.`);
 for(const [base,label]of inputFamilies)if(key===base||['on','off','toggle'].some(mode=>key===`${base}_${mode}`)){const mode=key.endsWith('_on')?'on':key.endsWith('_off')?'off':'toggle';return entry(`${label} — ${mode}`,mode==='toggle'?`Toggles ${label.toLowerCase()}; use fresh state feedback before matching a physical switch.`:`Requests ${label.toLowerCase()} ${mode}. A game response and state feedback are still required.`);}
 m=key.match(/^v_power_(set|toggle)(?:_(thrusters|weapons|shields))?(?:_(on|off))?$/);if(m){const label={thrusters:'Engine',weapons:'Weapon',shields:'Shield'}[m[2]]??'Main';const mode=m[3]??'toggle';return entry(`${label} power — ${mode}`,`${mode==='toggle'?'Toggles':`Requests ${mode==='on'?'enabling':'disabling'}`} ${label.toLowerCase()} power. Main-power off can shut down the ship.`);}
 m=key.match(/^v_(close|open|lock|unlock|toggle)_all_(doors|doorlocks|ports|portlocks)$/);if(m)return entry(`${words(m[1])} all ${m[2]==='doorlocks'?'door locks':m[2]==='portlocks'?'port locks':m[2]}`,`Requests ${m[1]} for all ${m[2]}. These names appeared in the historical PTU list, but upstream reported door/lock/port requests being refused in tested contexts.`);
 return {label:words(key),description:'Newly advertised action. Its exact in-game effect has not yet been reviewed; inspect game feedback before assigning it.',unit:null,descriptionSource:'Unreviewed action name'};
}
