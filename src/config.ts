import { getInitialRepairs } from "./utils";

const internalRepairs = getInitialRepairs();

export const RepairStore = {
    getRepairs: () => { return internalRepairs },
    addRepair: (repair) => {
        internalRepairs.push(repair);;
    },
    updateRepair: (id, repair) => {
        const index = internalRepairs.findIndex(r => r.id === id);
        if (index !== -1) {
            internalRepairs[index] = { ...internalRepairs[index], ...repair };
        }
    },
    deleteRepair: (id) => {
        const index = internalRepairs.findIndex(r => r.id === id);
        if (index !== -1) {
            internalRepairs.splice(index, 1);
        }
    },
    getRepair: (id) => {
        const repair = internalRepairs.find(r => r.id === id);
        if (!repair) {
            throw new Error(`Repair with id ${id} not found`);
        }
        return repair;
    }
};