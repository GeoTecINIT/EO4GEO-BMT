export class PriorityQueue{
    private values: [string, number][];
    private keySet: Set<string>;
    constructor(){
        this.values = [];
        this.keySet = new Set();
    }
    
    enqueue(node: string, priority: number){
        var flag = false;
        for(let i=0; i<this.values.length; i++){
            if(this.values[i][1]>priority){
                this.values.splice(i, 0, [node, priority])
                flag = true;
                break;
            }
        }
        if(!flag){
            this.values.push([node, priority])
        }
        this.keySet.add(node);
    }
    
    dequeue(){
        const node = this.values.shift();
        this.keySet.delete(node[0]);
        return node;
    }
    
    size(){
        return this.values.length;
    }

    increasePriority(node: string, newPriority: number) {
        if (this.keySet.has(node)) {
            for (let i = 0; i < this.values.length; i++) {
                if (this.values[i][0] === node && this.values[i][1]>newPriority) {
                    this.values.splice(i, 1);
                    break;
                }
            }
        }
        this.enqueue(node, newPriority);
    }
}