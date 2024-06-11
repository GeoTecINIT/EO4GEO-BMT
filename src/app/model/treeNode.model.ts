export class TreeNode {
    code: string;
    relations: [string, number][];

    constructor(code: string, relations: [string, number][]) {
        this.code = code;
        this.relations = relations;
    }
}