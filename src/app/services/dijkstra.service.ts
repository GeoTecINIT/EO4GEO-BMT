import { Injectable } from "@angular/core";
import { TreeNode } from "../model/treeNode.model";
import { PriorityQueue } from "../model/priorityQueue.model";
import { BokService } from "./bok.service";

@Injectable({
    providedIn: 'root'
  })
  export class DijkstraService {

    private graph: Map<string, TreeNode>;

    constructor(private readonly bokService: BokService) {}

    private dijkstra(
        start: TreeNode,
        threshold: number = Infinity,
    ) {
        const priorityQueue = new PriorityQueue();
        const distances: Map<string, number> = new Map();
    
        priorityQueue.enqueue(start.code, 0);
        distances.set(start.code, 0);
    
        while (priorityQueue.size() > 0) {
            const dequedValue = priorityQueue.dequeue();
            const code: string = dequedValue ? dequedValue[0] : '';
            const currDistance: number = (distances.get(code) !== undefined) ? distances.get(code) : Infinity;
    
            if (currDistance > threshold) break;
    
            const node: TreeNode | undefined = this.graph.get(code);
            if (node) {
                node.relations.forEach(([child, weight]) => {
                    const newDistance: number = currDistance + weight;
                    const childDistance: number = (distances.get(child) !== undefined) ? distances.get(child) : Infinity;
    
                    if (newDistance < childDistance && newDistance < threshold) {
                        priorityQueue.increasePriority(child, weight);
                        distances.set(child, newDistance);
                    }
                });
            }
          }
          return distances
    }

    private buildGraph (concepts: any[], relations: any[]) {
        const graph: Map<string, TreeNode> = new Map();
        concepts.forEach(concept => {
            graph.set(concept.code, new TreeNode(concept.code, []));
        });
        relations.forEach(relation => {
            const sourceCode = concepts[relation.source].code;
            const targetCode = concepts[relation.target].code;
            const sourceNode = graph.get(sourceCode);
            const targetNode = graph.get(targetCode);

            if (sourceNode && targetNode) {
                switch (relation.name) {
                    case 'is subconcept of':
                        sourceNode.relations.push([targetCode, 1.5]);
                        targetNode.relations.push([sourceCode, 1]);
                        break;
                    case 'is prerequisite of':
                        sourceNode.relations.push([targetCode, 0.7]);
                        targetNode.relations.push([sourceCode, 1]);
                        break;
                    case 'is similar to':
                        sourceNode.relations.push([targetCode, 1]);
                        targetNode.relations.push([sourceCode, 1]);
                        break;
                }
            }
        });
        return graph;
    }

    public getDistanceMap (code: string, threshold: number = 2): Map<string, number> {
        if (!this.graph) this.graph = this.buildGraph(this.bokService.getConcepts(), this.bokService.getRelations());
        const start: TreeNode = this.graph.get(code)
        if (!start) throw new Error('Invalid concept');
        const distanceMap: Map<string, number> = this.dijkstra(start, threshold);
        distanceMap.forEach( (value: number, key: string, map: Map<string, number>) => {
            const percentage = threshold === 0 ? 100 : Math.trunc((1 - (value / threshold)) * 100);
            map.set(key, percentage);
        })
        return distanceMap;
    }
  }