// Helper function to create generic presets for job titles that don't have detailed data
const createPlaceholderPreset = (jobTitle: string, trade: string) => {
  const brands: { [key: string]: string } = {
    "Electrical": "SparkSafe Electrical",
    "Renovation": "SolidBuild Renovations",
    "Plumbing": "PureFlow Plumbing",
    "HVAC": "ComfortZone HVAC"
  };
  const licenses: { [key: string]: string } = {
    "Electrical": "EL-98765",
    "Renovation": "GC-54321",
    "Plumbing": "PL-12345",
    "HVAC": "HV-67890"
  };
  return {
    siteAddress: '123 Example St, City, ST',
    clientType: 'Homeowner',
    summary: `Standard project to perform: ${jobTitle}. Includes all necessary materials and labor for a complete installation.`,
    packages: {
      good: {
        scope: `- Basic scope for ${jobTitle}\n- Standard materials`,
        materialLineItems: `${jobTitle} Materials (Basic) | 1 | lot | 600`,
        laborLineItems: `${jobTitle} Labor (Basic) | 4 | hrs`,
      },
      better: {
        scope: `- Standard scope for ${jobTitle}\n- Mid-grade materials\n- Includes cleanup`,
        materialLineItems: `${jobTitle} Materials (Standard) | 1 | lot | 900`,
        laborLineItems: `${jobTitle} Labor (Standard) | 6 | hrs`,
      },
      best: {
        scope: `- Premium scope for ${jobTitle}\n- High-end materials\n- Extended warranty`,
        materialLineItems: `${jobTitle} Materials (Premium) | 1 | lot | 1400`,
        laborLineItems: `${jobTitle} Labor (Premium) | 8 | hrs`,
      }
    },
    materialMarkupPercent: 25,
    laborRate: 95,
    constraints: 'Standard work hours (9am-5pm). Client to provide clear access to the work area.',
    warranty: 12,
    validity: 30,
    tax: 5,
    discount: 0,
    deposit: 40,
    currency: 'CAD',
    timeline: '1-3 days',
    brand: brands[trade],
    license: licenses[trade],
    proposalNumberPrefix: brands[trade].substring(0,3).toUpperCase(),
    companyLogo: '',
    attachments: [],
    primaryColor: '#00D58C',
    secondaryColor: '#F59E0B',
  };
};

const jobTitles = {
  "Electrical": [
    "Panel Upgrade (200A)",
    "Level-2 EV Charger Install (240V)",
    "Pot Light Package (12x LED + Dimmer)",
    "Kitchen Remodel Wiring",
    "Basement Suite Rough-In",
    "Bathroom Fan Replace + GFCI Updates",
    "Hot Tub / Spa Circuit (GFCI + Disconnect)",
    "Whole-Home Surge Protector (Type 2 SPD)",
    "Smoke/CO Alarm Upgrade (Hardwired Interconnect)",
    "Dedicated Appliance Circuit (Range/Microwave/Freezer)",
    "Garage Sub-Panel + Outlets/Lighting",
    "Exterior / Landscape Lighting Install",
    "Service Mast / Meter Base Repair",
    "Generator Interlock / Transfer Switch",
    "Troubleshooting & Small Repairs"
  ],
  "Renovation": [
    "Bathroom Renovation (Standard)",
    "Kitchen Renovation (Cabinets, Counters, Lighting)",
    "Basement Development / Suite Conversion",
    "Framing & Drywall (Room Addition)",
    "Flooring Replace (LVP/Tile)",
    "Interior Doors & Trim Package",
    "Window & Exterior Door Replacement",
    "Deck Build or Re-Decking",
    "Fence Build / Repair",
    "Exterior Siding Repair/Replace",
    "Insulation & Vapour Barrier Upgrade",
    "Tile Shower Rebuild (Waterproofing + Niche)",
    "Interior Paint (Whole Home or Per Room)",
    "Garage Build / Remodel (Shelving + Lighting)",
    "Insurance Restoration (Water/Fire Repair)"
  ],
  "Plumbing": [
    "Hot Water Tank Replacement (40–50 gal)",
    "Tankless Water Heater Install",
    "Kitchen Faucet & Sink Replace",
    "Bathroom Rough-In (Renovation)",
    "Toilet Install or Replace",
    "Tub/Shower Valve Replacement",
    "Drain Cleaning / Snaking",
    "Main Water Shutoff & PRV Replacement",
    "Water Softener Install",
    "Reverse Osmosis System Install",
    "Sump Pump Install or Replace",
    "Dishwasher Hookup",
    "Laundry Box & Hose Bib Upgrade",
    "Gas Line Install (BBQ/Range)",
    "Leak Detection & Small Repairs"
  ],
  "HVAC": [
    "Furnace Replacement (High-Efficiency)",
    "Air Conditioner Install (Split)",
    "Heat Pump Install (Ducted or Ductless)",
    "Thermostat Upgrade (Smart)",
    "Duct Cleaning & Sanitizing",
    "Ductwork Add/Modify (Basement/Addition)",
    "HRV/ERV Install (Fresh Air System)",
    "Garage Heater Install",
    "Humidifier Install (Bypass/Powered)",
    "AC Recharge/Service (Diagnostic)",
    "Gas Line for Furnace/Appliance (HVAC Scope)",
    "Mini-Split Install (Single Zone)",
    "Mini-Split Install (Multi-Zone)",
    "Combustion Air / Venting Correction",
    "Annual Furnace/AC Tune-Up"
  ]
};

const detailedPresets: { [trade: string]: { jobs: { [project: string]: any } } } = {
  "Electrical": {
    jobs: {
      "Panel Upgrade (200A)": {
        siteAddress: '123 Main St, Calgary, AB',
        clientType: 'Homeowner',
        summary: 'Upgrade main electrical panel to 200A service to accommodate modern loads. Includes new breakers and panel labeling.',
        packages: {
          good: {
            scope: '- Supply & install 150A panel\n- Standard breakers\n- Label circuits',
            materialLineItems: '150A Panel Kit | 1 | kit | 400\nStandard Breakers | 12 | ea | 15',
            laborLineItems: 'Panel installation | 6 | hrs'
          },
          better: {
            scope: '- Supply & install 200A panel\n- Combination AFCI/GFCI breakers on required circuits\n- Label circuits',
            materialLineItems: '200A Panel Kit | 1 | kit | 550\nAFCI/GFCI Breakers | 4 | ea | 65',
            laborLineItems: 'Panel installation & advanced wiring | 8 | hrs'
          },
          best: {
            scope: '- Supply & install 200A panel\n- Combination AFCI/GFCI breakers\n- Whole-home surge protector\n- Label circuits',
            materialLineItems: '200A Panel Kit | 1 | kit | 550\nAFCI/GFCI Breakers | 6 | ea | 65\nWhole-Home Surge Protector | 1 | ea | 250',
            laborLineItems: 'Panel & surge protector installation | 9 | hrs'
          },
        },
        materialMarkupPercent: 30,
        laborRate: 110,
        constraints: 'Power will be off for 4-6 hours during installation. ESA inspection coordinated.',
        warranty: 24,
        validity: 30,
        tax: 5,
        discount: 0,
        deposit: 40,
        currency: 'CAD',
        timeline: '1 day',
        brand: 'TrueCan Power Systems',
        license: 'AB-ELC-123456',
        proposalNumberPrefix: 'TPS',
        companyLogo: '',
        attachments: ['photo_of_old_panel.jpg', 'site_access_notes.pdf'],
        primaryColor: '#22D3EE',
        secondaryColor: '#F59E0B',
      },
      "Level-2 EV Charger Install (240V)": {
        siteAddress: '456 Tech Ave, Toronto, ON',
        clientType: 'Homeowner',
        summary: 'Install a Level 2 EV charger in the garage. Includes running a new dedicated circuit from the main panel.',
        packages: {
          good: {
            scope: '- Install customer-provided Level 2 EV charger\n- Run 40A circuit with 8/3 NMD wire (up to 15m)\n- Install 40A 2-pole breaker',
            materialLineItems: '40A breaker | 1 | ea | 40\n8/3 NMD wire | 15 | m | 8\nMisc. materials | 1 | lot | 50',
            laborLineItems: 'Install customer-provided EV charger | 3 | hrs'
          },
          better: {
            scope: '- Supply & install Tesla Wall Connector (Gen 3)\n- Run 60A circuit with 6/3 NMD wire (up to 15m)\n- Install 60A 2-pole breaker',
            materialLineItems: 'Tesla Wall Connector | 1 | ea | 650\n60A breaker | 1 | ea | 60\n6/3 NMD wire | 15 | m | 12\nMisc. materials | 1 | lot | 60',
            laborLineItems: 'Supply & Install EV charger | 4 | hrs'
          },
          best: {
            scope: '- Supply & install Tesla Wall Connector (Gen 3)\n- Run 60A circuit with 6/3 armored cable (up to 15m)\n- Install 60A 2-pole GFCI breaker for added safety',
            materialLineItems: 'Tesla Wall Connector | 1 | ea | 650\n60A GFCI breaker | 1 | ea | 150\n6/3 Armored Cable | 15 | m | 18\nMisc. materials | 1 | lot | 75',
            laborLineItems: 'Premium EV charger installation | 4.5 | hrs'
          },
        },
        materialMarkupPercent: 25,
        laborRate: 115,
        constraints: 'Garage access required. Installation location to be confirmed with client.',
        warranty: 24,
        validity: 30,
        tax: 13,
        discount: 0,
        deposit: 50,
        currency: 'CAD',
        timeline: '1 day',
        brand: 'ChargeRight Electrical',
        license: 'ON-ELC-789012',
        proposalNumberPrefix: 'CRE',
        companyLogo: '',
        attachments: [],
        primaryColor: '#00D58C',
        secondaryColor: '#F59E0B',
      }
    }
  },
  "Plumbing": {
    jobs: {
      "Hot Water Tank Replacement (40–50 gal)": {
        siteAddress: '789 Waterfront Rd, Vancouver, BC',
        clientType: 'Property Manager',
        summary: 'Replace a leaking 40-gallon electric hot water tank with a new, efficient model. Includes removal and disposal of the old unit.',
        packages: {
          good: {
            scope: '- Supply & install standard 40-gallon electric hot water tank\n- New flexible connectors\n- Disposal of old tank',
            materialLineItems: '40-Gallon Electric HWT | 1 | ea | 650\nFlex connectors & fittings | 1 | lot | 50\nDisposal Fee | 1 | ea | 50',
            laborLineItems: 'Standard HWT replacement | 2 | hrs'
          },
          better: {
            scope: '- Supply & install high-efficiency 50-gallon electric hot water tank\n- New ball valve shutoff\n- New drain pan\n- Disposal of old tank',
            materialLineItems: '50-Gallon HE HWT | 1 | ea | 950\nBall valve shutoff | 1 | ea | 40\nDrain pan | 1 | ea | 30\nDisposal Fee | 1 | ea | 50',
            laborLineItems: 'HE HWT replacement | 2.5 | hrs'
          },
          best: {
            scope: '- Supply & install premium 50-gallon electric hot water tank with 12-year warranty\n- New ball valve shutoff & drain pan\n- Thermal expansion tank for code compliance\n- Disposal of old tank',
            materialLineItems: '50-Gallon Premium HWT | 1 | ea | 1200\nBall valve shutoff | 1 | ea | 40\nDrain pan | 1 | ea | 30\nThermal expansion tank | 1 | ea | 120\nDisposal Fee | 1 | ea | 50',
            laborLineItems: 'Premium HWT & expansion tank install | 3 | hrs'
          },
        },
        materialMarkupPercent: 35,
        laborRate: 120,
        constraints: 'Clear access to mechanical room required. Water will be shut off for 2-3 hours.',
        warranty: 12,
        validity: 30,
        tax: 12,
        discount: 5,
        deposit: 50,
        currency: 'CAD',
        timeline: '3-4 hours',
        brand: 'Flow Masters Plumbing',
        license: 'BC-PLM-334455',
        proposalNumberPrefix: 'FMP',
        companyLogo: '',
        attachments: [],
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
      }
    }
  }
};


// Build the final PRESETS object
export const PRESETS: { [trade: string]: { jobs: { [project: string]: any } } } = {};

for (const trade in jobTitles) {
  if (Object.prototype.hasOwnProperty.call(jobTitles, trade)) {
    PRESETS[trade] = { jobs: {} };
    const titles = (jobTitles as any)[trade];
    for (const title of titles) {
      // Check if a detailed preset exists
      if (detailedPresets[trade] && detailedPresets[trade].jobs[title]) {
        PRESETS[trade].jobs[title] = detailedPresets[trade].jobs[title];
      } else {
        PRESETS[trade].jobs[title] = createPlaceholderPreset(title, trade);
      }
    }
  }
}