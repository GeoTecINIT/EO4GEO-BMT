import { Field } from '../services/fields.service';
import { Language } from '../services/language.service';

export interface Competence {
  uri?: String;
  skillType?: String;
  reuseLevel?: String;
  preferredLabel: String;
  description?: String;
  altLabels?: String[];
}

export class OcupationalProfile extends Object {
  constructor(
    public _id: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public title: string,
    public description: string,
    public fields: Field[],
    public eqf: number,
    public knowledge: string[],
    public skills: string[],
    public customSkills: string[],
    public customCompetences: string[],
    public competences: Competence[],
    public isPublic: boolean = false
  ) {
    super();
  }
}

export class JobOffer extends Object {
  constructor(
    public _id: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public occuProf: OcupationalProfile,
    public languages: Language[],
    public location: string,
    public dedication: string,
    public typeContract: string,
    public salaryMin: number,
    public salaryMax: number,
    public additionalQuestions: string[],
    public motivationLetter: boolean,
    public isPublic: boolean = false,
    public dataRequired: any[],
    public toolsRequired: any[],
    public yearsExperience: number
  ) {
    super();
  }
}

export class Match extends Object {
  constructor(
    public _id: string,
    public userId: string,
    public orgId: string,
    public title: string,
    public description: string,
    public orgName: string,
    public isPublic: boolean = false,
    public resource1: Resource,
    public resource2: Resource,
    public commonConcepts: any[],
    public notMatchConcepts1: any[],
    public notMatchConcepts2: any[],
    public partialMatchConcepts1: any[],
    public partialMatchConcepts2: any[],
    public updatedAt: any,
    public createdAt: any,
    public division: string
  ) {
    super();
  }
}

export class Resource extends Object {
  constructor(
    public _id: string,
    public url: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public division: string,
    public collection: string,
    public collectionDisplay: string,
    public isPublic: boolean = false,
    public levelPublic: boolean = false,
    public name: string,
    public title: string, // OP have title instead of name
    public description: string,
    public concepts: any[],
    public skills: any,
    // public fields: Field[],
    public children: Resource[], // SP have their knowledge in children
    public occuProf: OcupationalProfile, // JO have some data in the OP
    public knowledge: string[],
    public type: number,
    public eqf: number,
    public score: number
  ) {
    super();
  }
}

export class Other extends Object {
  constructor(
    public _id: string,
    public url: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public collection: string,
    public collectionDisplay: string,
    public isPublic: boolean = false,
    public name: string,
    public title: string,
    public description: string,
    public concepts: any[],
    public type: number,
  ) {
    super();
  }
}

export class TrainingMaterial extends Object {
  constructor(
    public _id: string,
    public url: string,
    public userId: string,
    public orgId: string,
    public orgName: string,
    public collection: string,
    public collectionDisplay: string,
    public isPublic: boolean = false,
    public name: string,
    public title: string,
    public description: string,
    public abstract: string,
    public contributors: any[],
    public concepts: any[],
    public type: number,
    public eqf: number,
    public creators: any[],
    public updatedAt: any,
    public hasMetadata: boolean,
  ) {
    super();
  }
}

