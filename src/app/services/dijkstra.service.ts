import { Injectable } from "@angular/core";
import { RelationType, TreeNode, TreeRelation } from "../model/treeNode.model";
import { PriorityQueue } from "../model/priorityQueue.model";
import { BokService } from "./bok.service";
import { forEach } from "@angular/router/src/utils/collection";

@Injectable({
    providedIn: 'root'
  })
  export class DijkstraService {

    private graph: Map<string, TreeNode>;
    private knowledgeNodes: Set<string>;
    readonly mainNode = 'GIST';

    constructor(private readonly bokService: BokService) {}

    private loadKnowledgeNodes(): Set<string> {
        if (!this.graph) this.graph = this.buildGraph(this.bokService.getConcepts(), this.bokService.getRelations());
        let nodes: Set<string> = new Set();
        let mainNode: TreeNode = this.graph.get(this.mainNode);
        for (let relation of mainNode.relations) {
            if (relation.type === RelationType.IsSuperconceptOf) {
                nodes.add(relation.target);
            }
        }
        return nodes;
    }

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
                node.relations.forEach(({target, weight}) => {
                    const newDistance: number = currDistance + weight;
                    const targetDistance: number = (distances.get(target) !== undefined) ? distances.get(target) : Infinity;
    
                    if (newDistance < targetDistance && newDistance < threshold) {
                        priorityQueue.increasePriority(target, weight);
                        distances.set(target, newDistance);
                    }
                });
            }
          }
          return distances
    }

    private buildGraph (concepts: any[], relations: any[]) {
        const graph: Map<string, TreeNode> = new Map();
        concepts.forEach(concept => {
            graph.set(concept.code, new TreeNode(concept.code, concept.name, []));
        });
        relations.forEach(relation => {
            const sourceCode = concepts[relation.source].code;
            const targetCode = concepts[relation.target].code;
            const sourceNode = graph.get(sourceCode);
            const targetNode = graph.get(targetCode);

            if (sourceNode && targetNode) {
                switch (relation.name) {
                    case 'is subconcept of':
                        const relationType = (targetCode === this.mainNode) ? RelationType.GIST : RelationType.IsSubconceptOf;
                        sourceNode.relations.push(new TreeRelation(targetCode, relationType));
                        targetNode.relations.push(new TreeRelation(sourceCode, RelationType.IsSuperconceptOf));
                        break;
                    case 'is prerequisite of':
                        sourceNode.relations.push(new TreeRelation(targetCode, RelationType.IsPrerequisiteOf));
                        targetNode.relations.push(new TreeRelation(sourceCode, RelationType.HasPrerequisite));
                        break;
                    case 'is similar to':
                        sourceNode.relations.push(new TreeRelation(targetCode, RelationType.IsSimilarTo));
                        targetNode.relations.push(new TreeRelation(sourceCode, RelationType.IsSimilarTo));
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

    public getTreeNode (code: string): TreeNode {
        return this.graph.get(code);
    }

    public getKnowledgeNodes() {
        if (!this.knowledgeNodes) this.knowledgeNodes = this.loadKnowledgeNodes();
        return this.knowledgeNodes;
    }

    public getParents(concept: string): Set<string> {
        let parents: Set<string> = new Set();
    
        const findParents = (node: TreeNode) => {
          for (let relation of node.relations) {
            if (relation.type === RelationType.IsSubconceptOf) {
              let parentNode = this.getTreeNode(relation.target);
              if (this.getKnowledgeNodes().has(parentNode.code)) {
                parents.add(parentNode.code);
              } else if (parentNode){
                findParents(parentNode);
              }
            }
          }
        }
    
        if (this.getKnowledgeNodes().has(concept) || concept === this.mainNode) {
          parents.add(concept);
        } else {
          let currentNode = this.getTreeNode(concept);
          if (currentNode) findParents(currentNode);
        }
    
        return parents;
      }
  }