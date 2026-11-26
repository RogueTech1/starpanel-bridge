# Board library and DCSBIOSKit catalog

Open **Board library** in StarPanel. The library contains the **16 products listed in DCSBIOSKit's shop on 26 November 2026**, plus the existing standalone ESP32/Arduino choices. Product names link to manufacturer pages. The catalog is bundled offline; it does not fetch prices, stock or firmware automatically.

Search by name/purpose and filter by vendor or hardware role. **Use in new panel** selects a programmable board in an empty designer. To preserve an existing design, save it and choose **New panel** first. **Open master connection** opens the separate master workflow without connecting or flashing automatically. Other entries explain their role without offering a misleading panel upload.

## Programmable slave boards

| Product | Designer profile | Bundled image | Programming |
| --- | --- | --- | --- |
| [Nano Slave](https://dcsbioskit.com/product/nano-slave/) | `nano` | `nano-panel` | External slave programmer; modern ATmega328P bootloader |
| [Nano Shield](https://dcsbioskit.com/product/dcs-bios-nano-shield/) | `dcs-nano-shield` | `nano-panel` | Requires an Arduino Nano; same slave transport/configuration |
| [Mega Slave](https://dcsbioskit.com/product/dcs-bios-mega-slave/) | `mega` | `mega-panel` | External slave programmer; ATmega2560 |
| [Mega Shield](https://dcsbioskit.com/product/dcs-bios-mega-shield/) | `dcs-mega-shield` | `mega-panel` | Requires an Arduino Mega 2560; same slave transport/configuration |

Each has an address from 1–126 and an independently programmed EEPROM design for input pins, command names and readout listeners. Address collision checks cover all four variants. Runtime traffic goes through the master; disconnect the programmer before reconnecting the powered bus. Follow the [complete programming steps](DCSBIOSKIT.md).

Profiles share already bundled images; distinct board names do not require duplicated firmware. There are now **19 panel menu variants**, using eight ESP32 images and eight panel AVR images, plus the separate master image. Compiler/image checks do not replace physical board validation.

### Reserved pins and revisions

RS485 uses TX-enable **D2** and serial pins. I2C display pins are also reserved. The Nano Shield specifies D5/D6 for backlighting. Nano slave/shield profiles conservatively exclude D4/D5/D6/D13 to avoid conflicts with revision-sensitive backlight/indicator wiring. This release removes D6 from the older combined Nano profile; an existing design using it must be reassigned and saved before upload.

The Mega Shield product description says D4/D5 for backlighting, while its specification says D4/D13. Mega profiles exclude **all three** until exact PCB labels/revision are confirmed. Do not assume the product page resolves the discrepancy. These exclusions also apply when the backlight DIP switches are off; custom firmware may reclaim a pin only after wiring/revision verification.

The visual programmer supports buttons, maintained switches and SSD1306 readouts on these AVR boards. The vendor's backlight PWM, LED matrices, Nextion headers, servos and encoders require custom drivers/firmware; their presence on a product is not a bundled feature claim.

## Master, development and distribution boards

| Product | Library behavior |
| --- | --- |
| [Master Controller](https://dcsbioskit.com/product/master-controller/) | Separate three-bus router workflow and verified master image; never a slave design target |
| [RS485 DevKit](https://dcsbioskit.com/product/dcs-bios-rs485-devkit/) | One PCB with three separately programmable controllers, detailed below |
| [Hub](https://dcsbioskit.com/product/dcs-bios-hub/) | Eight slave connections plus uplink/daisy-chain distribution; no upload/address |
| [External Connector](https://dcsbioskit.com/product/dcs-bios-external-connector/) | USB/bus mounting/interconnect PCB; no upload/address |
| [Slave Programmer](https://dcsbioskit.com/product/programmer-ftdi/) | USB-serial programming adapter, not a panel MCU or runtime slave |

### RS485 DevKit: three programming contexts

The vendor describes a master, a Nano slave with a **MAX7219/48-LED** arrangement, and a Mega slave with **48 directly connected LEDs**, each with USB access. It also notes limited exposed headers and optional bootloader installation.

The library records all three contexts instead of treating the entire PCB as one Arduino. There is no automatic DevKit upload target: its exact master enable-pin routing, LED/header pin assignments and selected bootloader option need confirmation. Standard Nano/Mega MCU compatibility alone does not establish that the panel OLED/input image is appropriate for the onboard LEDs.

For custom development, verify the PCB revision and schematic, install the correct bootloader via ISP if absent, identify each controller's USB port, and build a separate sketch per MCU. Add an explicit pin map and image manifest before promoting a DevKit target into the easy programmer. Keep the powered bus disconnected while programming slaves and follow the vendor's power-source instructions. This avoids overwriting the master or driving an undocumented onboard circuit.

## Other listed products

The library also includes the [Getting Started Kit](https://dcsbioskit.com/product/getting-started-kit/) with links between its constituent products; the [30 cm](https://dcsbioskit.com/product/hub-cable-30cm/), [60 cm](https://dcsbioskit.com/product/hub-master-interconnect-cable-60cm/) and [1 m](https://dcsbioskit.com/product/hub-master-interconnect-cable-1m/) master/hub cables; the [1 m slave cable](https://dcsbioskit.com/product/slave-cable-1m/); and the [ATX Power Switch](https://dcsbioskit.com/product/atx-power-switch/). These are bundles/accessories, not additional flash targets.

The store's [FalconDCC turntable controller](https://dcsbioskit.com/product/falcondcc-turntable-controller-for-kato-turntables/) is included for catalog completeness and explicitly marked outside StarPanel support. It serves model railway DCC/Wi-Fi control; cockpit firmware must not be uploaded to it.

Powered RS485 connectors are **not Ethernet**. Remove power before bus/cable changes, and never connect them to network equipment. See [manufacturer instructions](https://dcsbioskit.com/instructions/) and the [hardware guide](HARDWARE.md).

## Maintain the library

[`src/hardware-library.mjs`](../src/hardware-library.mjs) holds the reviewed product metadata, source links, bundles and programming roles. [`src/profiles.mjs`](../src/profiles.mjs) owns allowed designer pins and slave classification; [`src/avr.mjs`](../src/avr.mjs) owns compatible upload targets. Metadata cannot turn an unsupported/passive product into a flash target.

When the shop or PCB revisions change, recheck both [shop pages](https://dcsbioskit.com/shop/) and [page 2](https://dcsbioskit.com/shop/page/2/), inspect product specifications, update the review date and document unresolved conflicts. Preserve existing saved profile IDs. Test address collisions across aliases, excluded pins and image selection before publishing.
