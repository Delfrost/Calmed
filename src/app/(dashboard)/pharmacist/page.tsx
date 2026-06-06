'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
  Clock,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StockIndicator from '@/components/prescription/StockIndicator';

interface Batch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  costPrice: number;
  sellingPrice: number;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  totalStock: number;
  batches: Batch[];
}

const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-001',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Cipla Ltd',
    totalStock: 250,
    batches: [
      { batchNumber: 'PCM-2026-A1', quantity: 150, expiryDate: '2027-06-15', costPrice: 1.2, sellingPrice: 2.5 },
      { batchNumber: 'PCM-2026-B2', quantity: 100, expiryDate: '2027-09-20', costPrice: 1.2, sellingPrice: 2.5 },
    ],
  },
  {
    id: 'med-002',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '500mg',
    manufacturer: 'Sun Pharma',
    totalStock: 85,
    batches: [
      { batchNumber: 'AMX-2026-C1', quantity: 50, expiryDate: '2027-03-10', costPrice: 4.5, sellingPrice: 8.0 },
      { batchNumber: 'AMX-2026-D2', quantity: 35, expiryDate: '2027-08-25', costPrice: 4.8, sellingPrice: 8.5 },
    ],
  },
  {
    id: 'med-003',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'USV Pvt Ltd',
    totalStock: 320,
    batches: [
      { batchNumber: 'MET-2026-E1', quantity: 200, expiryDate: '2028-01-15', costPrice: 1.5, sellingPrice: 3.0 },
      { batchNumber: 'MET-2026-F2', quantity: 120, expiryDate: '2027-11-30', costPrice: 1.5, sellingPrice: 3.0 },
    ],
  },
  {
    id: 'med-005',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    category: 'Antihypertensive',
    dosageForm: 'Tablet',
    strength: '5mg',
    manufacturer: 'Pfizer',
    totalStock: 15,
    batches: [
      { batchNumber: 'AML-2026-G1', quantity: 15, expiryDate: '2027-04-20', costPrice: 3.0, sellingPrice: 6.0 },
    ],
  },
  {
    id: 'med-007',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Statin',
    dosageForm: 'Tablet',
    strength: '20mg',
    manufacturer: 'Ranbaxy',
    totalStock: 0,
    batches: [],
  },
];

export default function PharmacistInventory() {
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  // Form states
  const [formMode, setFormMode] = useState<'NEW_MED' | 'NEW_BATCH'>('NEW_BATCH');
  const [selectedMedId, setSelectedMedId] = useState('med-001');

  // Form inputs
  const [medName, setMedName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Analgesic');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [medicines, searchQuery]);

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber || !quantity || !costPrice || !sellingPrice || !expiryDate) return;

    if (formMode === 'NEW_BATCH') {
      setMedicines((prev) =>
        prev.map((med) => {
          if (med.id === selectedMedId) {
            const newBatch: Batch = {
              batchNumber,
              quantity: parseInt(quantity),
              expiryDate,
              costPrice: parseFloat(costPrice),
              sellingPrice: parseFloat(sellingPrice),
            };
            return {
              ...med,
              totalStock: med.totalStock + newBatch.quantity,
              batches: [...med.batches, newBatch],
            };
          }
          return med;
        })
      );
    } else {
      if (!medName || !strength) return;
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        name: medName,
        genericName,
        category,
        dosageForm,
        strength,
        manufacturer,
        totalStock: parseInt(quantity),
        batches: [
          {
            batchNumber,
            quantity: parseInt(quantity),
            expiryDate,
            costPrice: parseFloat(costPrice),
            sellingPrice: parseFloat(sellingPrice),
          },
        ],
      };
      setMedicines((prev) => [...prev, newMed]);
    }

    // Clear forms
    setBatchNumber('');
    setQuantity('');
    setCostPrice('');
    setSellingPrice('');
    setExpiryDate('');
    setMedName('');
    setGenericName('');
    setStrength('');
    setManufacturer('');
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return 'out_of_stock';
    if (stock < 20) return 'low_stock';
    return 'in_stock';
  };

  return (
    <div className="space-y-6">
      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Catalog Items</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{medicines.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Medicines</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {medicines.filter((m) => m.totalStock > 0 && m.totalStock < 20).length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Depleted Out-of-Stock</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">
              {medicines.filter((m) => m.totalStock === 0).length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Inventory List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Pharmacy Inventory Catalog
                </h3>
                <button
                  onClick={() => setMedicines(INITIAL_MEDICINES)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Reset Catalog"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drug name, generic, category..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Catalog Items list */}
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px]">
              {filteredMedicines.map((med) => {
                const isExpanded = expandedMedId === med.id;
                const status = getStockStatus(med.totalStock);

                return (
                  <div key={med.id} className="transition-colors hover:bg-slate-50/20">
                    <div
                      onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-extrabold text-slate-800 truncate">{med.name}</span>
                          <span className="text-[10px] italic text-slate-400 truncate">{med.genericName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {med.dosageForm} · {med.strength} · {med.category} · {med.manufacturer}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StockIndicator stockStatus={status} quantity={med.totalStock} />
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Collapsible details (Active batches inside) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                        >
                          <div className="p-4 pl-8 space-y-2">
                            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5 mb-1.5">
                              <span>Batch Code</span>
                              <span className="text-center">Stock</span>
                              <span className="text-right">Price</span>
                              <span className="text-right">Expiry</span>
                            </div>

                            {med.batches.map((batch) => (
                              <div
                                key={batch.batchNumber}
                                className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-2 text-[11px] font-semibold text-slate-600 items-center py-1"
                              >
                                <span className="text-slate-800 font-mono">{batch.batchNumber}</span>
                                <span className="text-center font-bold text-slate-500">{batch.quantity} units</span>
                                <span className="text-right font-bold text-slate-800 font-display">₹{batch.sellingPrice}</span>
                                <span className="text-right text-[10px] text-slate-400 flex items-center justify-end gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {batch.expiryDate}
                                </span>
                              </div>
                            ))}

                            {med.batches.length === 0 && (
                              <p className="text-[10px] text-slate-400 py-1 text-center font-medium italic">
                                No active stock batches found. Please add a new batch using the form.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Click on catalog entries to expand cost splits and expiry batches details.
          </div>
        </div>

        {/* Right: Add batch / catalog form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
                <FolderPlus className="h-5 w-5 text-blue-500" />
                Inventory Dispatch / Intake
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingest new pharmacy stock. Toggle modes to register new drugs or add batch units.
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFormMode('NEW_BATCH')}
                className={cn(
                  'py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                  formMode === 'NEW_BATCH' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Add Batch
              </button>
              <button
                type="button"
                onClick={() => setFormMode('NEW_MED')}
                className={cn(
                  'py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                  formMode === 'NEW_MED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                Register Medicine
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3.5">
              {formMode === 'NEW_BATCH' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Select Catalog Medicine
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.strength})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        required
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="e.g. Paracetamol"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Generic Name
                      </label>
                      <input
                        type="text"
                        required
                        value={genericName}
                        onChange={(e) => setGenericName(e.target.value)}
                        placeholder="e.g. Acetaminophen"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                      >
                        <option value="Analgesic">Analgesic</option>
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Antidiabetic">Antidiabetic</option>
                        <option value="Antihypertensive">Antihypertensive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Form
                      </label>
                      <select
                        value={dosageForm}
                        onChange={(e) => setDosageForm(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Strength
                      </label>
                      <input
                        type="text"
                        required
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        placeholder="e.g. 500mg"
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      required
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="e.g. Sun Pharma"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* Shared Batch specifications */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="PCM-2026-X1"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Batch Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="1.20"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Sell Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="2.50"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] mt-3"
              >
                Add Batch to Catalog
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Layers className="h-4 w-4 text-slate-300" />
            Batch levels auto-link with doctor pad prescribing limits.
          </div>
        </div>
      </div>
    </div>
  );
}
