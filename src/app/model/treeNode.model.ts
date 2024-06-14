class TreeNode {
    code: string;
    relations: TreeRelation[];

    constructor(code: string, relations: TreeRelation[]) {
        this.code = code;
        this.relations = relations;
    }
}

class TreeRelation {
    target: string;
    readonly weight: number;
    type: RelationType;

    constructor(target: string, type: RelationType) {
        this.target = target;
        this.type = type;
        switch (type) {
            case RelationType.IsSubconceptOf:
                this.weight = 1.5;
                break;
            case RelationType.IsSuperconceptOf:
                this.weight = 1;
                break;
            case RelationType.IsSimilarTo:
                this.weight = 1;
                break;
            case RelationType.IsPrerequisiteOf:
                this.weight = 0.7;
                break;
            case RelationType.HasPrerequisite:
                this.weight = 1;
                break;
            case RelationType.GIST:
                this.weight = 2;
                break;
            default:
                this.weight = 1;
        }
    }
}

enum RelationType {
    IsSubconceptOf = "is subconcept of",
    IsSuperconceptOf = "is superconcept of",
    IsSimilarTo = "is similar to",
    IsPrerequisiteOf = "is prerequisite of",
    HasPrerequisite = "has prerequisite",
    GIST = "GIST"
}

export {TreeNode, TreeRelation, RelationType}