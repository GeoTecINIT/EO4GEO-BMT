import {Component, OnInit, Input, ViewChild} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { OcupationalProfile, Match } from '../../model/resources.model';
import { ActivatedRoute } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService, User } from '../../services/user.service';
import {MatchService} from '../../services/match.service';
import { AngularFireStorage } from '@angular/fire/storage';
import {BokService} from '../../services/bok.service';
import { Chart } from 'chart.js';
import { ChartConceptsDirective } from './chart-concepts.directive';
import { DijkstraService } from '../../services/dijkstra.service';
import { RelationType, TreeNode } from '../../model/treeNode.model';
import { ChartNotCommon1Directive } from './chart-not-common1.directive';
import { ChartNotCommon2Directive } from './chart-not-common2.directive';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  statistics = [];
  isAnonymous = null;
  myChart = null;

  selectedMatch: Match;
  currentUser: User = new User();
  skillsMatch: any[] = [];
  skillsNotMatch1: any[] = [];
  skillsNotMatch2: any[] = [];

  fieldsMatch: any[] = [];
  fieldsNotMatch1: any[] = [];
  fieldsNotMatch2: any[] = [];

  transvSkillsMatch: any[] = [];
  transvSkillsNotMatch1: any[] = [];
  transvSkillsNotMatch2: any[] = [];


  allConcepts = [];

  numberOfConcepts1 = [];
  numberOfConcepts2 = [];
  statNumberOfConcepts1 = [];
  statNumberOfConcepts2 = [];

  profileUrl: Observable<any>;


  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  @ViewChild('chartCommonRef') public chartCommonRef: ChartConceptsDirective;
  @ViewChild('chartNoCommon1') public chartNoCommon1: ChartNotCommon1Directive;
  @ViewChild('chartNoCommon1') public chartNoCommon2: ChartNotCommon2Directive;

  constructor(
    private matchService: MatchService,
    private userService: UserService,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
    public afAuth: AngularFireAuth,
    public bokService: BokService,
    private dijkstraService: DijkstraService,
  ) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.isAnonymous = user.isAnonymous;
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
        });
      } else {
        this.isAnonymous = true;
      }
    });
  }

  ngOnInit() {
    this.getMatchId().subscribe(() => {
      this.bokService.isDataLoaded().subscribe(loaded => {
        if (loaded) {
          this.getRelations();
          this.getStatisticsNumberOfConcepts();
        }
      });
    });
  }

  getMatchId(): Observable<void> {
    const _id = this.route.snapshot.paramMap.get('name');
    this.skillsMatch = [];
    this.fieldsMatch = [];
    this.transvSkillsMatch = [];
    return this.matchService.getMatchById(_id).pipe(
      map(profile => {
        this.selectedMatch = profile;
        this.skillsNotMatch1 = [];
        this.skillsNotMatch2 = [];
        if (this.selectedMatch.resource1.skills && this.selectedMatch.resource1.skills.length > 0 ) {
          this.selectedMatch.resource1.skills.forEach(bok1 => {
            if (this.selectedMatch.resource2.skills && this.selectedMatch.resource2.skills.indexOf(bok1) !== -1) {
              this.skillsMatch.push(bok1);
            } else {
              this.skillsNotMatch1.push(bok1);
            }
          });
        }
        if (this.selectedMatch.resource2.skills && this.selectedMatch.resource2.skills.length > 0) {
          this.selectedMatch.resource2.skills.forEach(bok => {
            if (this.skillsMatch.indexOf(bok) < 0) {
              this.skillsNotMatch2.push(bok);
            }
          });
        }
        this.skillsMatch.sort();

        this.fieldsNotMatch1 = [];
        this.fieldsNotMatch2 = [];
        const fieldsResource1 = this.getFieldsFromResource(this.selectedMatch.resource1);
        const fieldsResource2 = this.getFieldsFromResource(this.selectedMatch.resource2);
        if (fieldsResource1.length > 0 ) {
          fieldsResource1.forEach(bok1 => {
            if (fieldsResource2.indexOf(bok1) !== -1) {
              this.fieldsMatch.push(bok1);
            } else {
              this.fieldsNotMatch1.push(bok1);
            }
          });
        }
        if (fieldsResource2.length > 0) {
          fieldsResource2.forEach(bok => {
            if (this.fieldsMatch.indexOf(bok) < 0) {
              this.fieldsNotMatch2.push(bok);
            }
          });
        }
        this.fieldsMatch.sort();

        this.transvSkillsNotMatch1 = [];
        this.transvSkillsNotMatch2 = [];
        const transversalSkills1 = this.getTransversalSkillsFromResource(this.selectedMatch.resource1);
        const transversalSkills2 = this.getTransversalSkillsFromResource(this.selectedMatch.resource2);
        if (transversalSkills1.length > 0 ) {
          transversalSkills1.forEach(bok1 => {
            if (transversalSkills2.indexOf(bok1) !== -1) {
              this.transvSkillsMatch.push(bok1);
            } else {
              this.transvSkillsNotMatch1.push(bok1);
            }
          });
        }
        if (transversalSkills2.length > 0) {
          transversalSkills2.forEach(bok => {
            if (this.transvSkillsMatch.indexOf(bok) < 0) {
              this.transvSkillsNotMatch2.push(bok);
            }
          });
        }
        this.transvSkillsMatch.sort();
      }));
  }

  downloadResource(url: string) {
    const ref = this.storage.ref(url);
    this.profileUrl = ref.getDownloadURL();
    this.profileUrl.subscribe(response => {
      window.open( response, '_blank');
    });
  }

  removeMatch(id: string) {
    this.matchService.removeMatch(id);
  }

  getFieldsFromResource(res) {
    // get fields from resource in our database
    const fields = [];
    if (res && res.fields && res.fields.length > 0) {
      res.fields.forEach(c => {
        fields.push(c.name);
      });
    } else if (!res.fields && res.occuProf && res.occuProf.fields) {
      res.occuProf.fields.forEach(c => {
        fields.push(c.name);
      });
    } else if (!res.fields && res.occuProf ) {
      fields.push(res.occuProf.field.name);
    }  else if (!res.fields && res.field ) {
      fields.push(res.field.name);
    }
    return fields;
  }

  getTransversalSkillsFromResource(res) {
    // get Transversal Skills from resource in our database
    const transversalSkills = [];
    if (res && res.competences && res.competences.length > 0) {
      res.competences.forEach(c => {
        transversalSkills.push(c.preferredLabel);
      });
    } else if (!res.competences && res.occuProf && res.occuProf.competences) {
      res.occuProf.competences.forEach(c => {
        transversalSkills.push(c.preferredLabel);
      });
    } else if (res.competences && res.competences.preferredLabel && !res.occuProf ) {
      transversalSkills.push(res.occuProf.competences.preferredLabel);
    }
    return transversalSkills;
  }

  getRelations() {
    const allConcepts = this.bokService.getConcepts();
    const allRelations = this.bokService.getRelations();
    this.allConcepts = this.bokService.getRelationsPrent(allRelations, allConcepts);
  }

  getStatisticsNumberOfConcepts() {
    const resource1Concepts = new Array().concat(this.selectedMatch.notMatchConcepts1, this.selectedMatch.partialMatchConcepts1, this.selectedMatch.commonConcepts);
    this.numberOfConcepts1 = this.getNumberOfConcepts(resource1Concepts);
    console.log(resource1Concepts)
    const resource2Concepts = new Array().concat(this.selectedMatch.notMatchConcepts2, this.selectedMatch.partialMatchConcepts2, this.selectedMatch.commonConcepts);
    this.numberOfConcepts2 = this.getNumberOfConcepts(resource2Concepts);
    let numberCommonConcepts = [];
    numberCommonConcepts = this.getNumberOfConcepts(this.selectedMatch.commonConcepts);
    this.statNumberOfConcepts1 = [];
    this.statNumberOfConcepts2 = [];
    let percentage1 = 0;
    let percentage2 = 0;
    Object.keys(numberCommonConcepts).forEach( bokConcept => {

      percentage1 = ( Math.round((numberCommonConcepts[bokConcept] * 100)   / this.numberOfConcepts1[bokConcept]));
      this.statNumberOfConcepts1.push({ code: bokConcept, value: percentage1, numberCommon: numberCommonConcepts[bokConcept],
        numberCon: this.numberOfConcepts1[bokConcept] });

      percentage2 = ( Math.round((numberCommonConcepts[bokConcept] * 100 )  / this.numberOfConcepts2[bokConcept]));
      this.statNumberOfConcepts2.push({ code: bokConcept, value: percentage2, numberCommon: numberCommonConcepts[bokConcept],
        numberCon: this.numberOfConcepts2[bokConcept] });

    });
  }
  getNumberOfConcepts(conceptsToAnalize) {
    const numConcepts = [];
    let i = 0;

    conceptsToAnalize.forEach(bok1 => {
      const codes = this.dijkstraService.getParents(bok1.code ? bok1.code : bok1);
      codes.forEach( code => {
        if (this.dijkstraService.getTreeNode(code).name !== undefined) {
          i = numConcepts[code] !== undefined ? numConcepts[code] + 1 : 1;
          numConcepts[code] = i;
        }
      });
    });
    return numConcepts;
  }
}
