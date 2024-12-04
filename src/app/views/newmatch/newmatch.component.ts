
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Match, Resource } from '../../model/resources.model';
import { MatchService } from '../../services/match.service';
import { OtherService } from '../../services/other.service';
import { Organization, OrganizationService } from '../../services/organization.service';
import { FieldsService, Field } from '../../services/fields.service';
import { EscoCompetenceService } from '../../services/esco-competence.service';
import { ResourceService } from '../../services/resource.service';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User, UserService } from '../../services/user.service';
import { FormBuilder, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Chart } from 'chart.js';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import { BokService } from '../../services/bok.service';
import { LoginComponent } from '../login/login.component';
import * as bok from '@eo4geo/find-in-bok-dataviz';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { environment } from '../../../environments/environment';
import { DijkstraService } from '../../services/dijkstra.service';
import { RelationType, TreeNode, TreeRelation } from '../../model/treeNode.model';


@Component({
  selector: 'app-newmatch',
  templateUrl: './newmatch.component.html',
  styleUrls: ['./newmatch.component.scss']
})
export class NewmatchComponent implements OnInit {

  model = new Match('', '', '', '', '', '', true, null, null, null, null, null, null, null, null, null, '');

  selectedMatch: Match;
  _id: string;
  mode: string;
  title: string;
  allConcepts = [];

  userOrgs: Organization[] = [];
  saveOrg: Organization;
  currentUser: User;

  userDivisions: string[] = [];
  saveDiv = '';

  showResource1 = -1;
  searchText1 = '';
  advancedSearch1 = false;
  conceptsFilter1 = '';
  skillsFilter1 = '';
  file1 = null;

  showResource2 = -1;
  searchText2 = '';
  advancedSearch2 = false;
  conceptsFilter2 = '';
  skillsFilter2 = '';
  file2 = null;

  filteredResources1 = [];
  filteredResources2 = [];
  filteredByType1 = [];
  filteredByType2 = [];
  selectedResources = [];

  meta1 = null;
  meta2 = null;

  bokConcepts1 = [];
  bokConcepts2 = [];
  commonBokConcepts = [];
  notMatchConcepts1 = [];
  notMatchConcepts2 = [];
  partialMatchConcepts1 = [];
  partialMatchConcepts2 = [];
  matchingFlexibility = 2;

  skills1 = [];
  skills2 = [];
  commonSkills = [];
  conceptsName = [];
  notMatchSkills1 = [];
  notMatchSkills2 = [];

  fields1 = [];
  fields2 = [];
  commonFields = [];
  notMatchFields1 = [];
  notMatchFields2 = [];

  transversalSkills1 = [];
  transversalSkills2 = [];
  commonTransversalSkills = [];
  notMatchTransversal1 = [];
  notMatchTransversal2 = [];

  numberOfConcepts1 = [];
  numberOfConcepts2 = [];

  resource1 = null;
  resource2 = null;

  uploadPercent1 = null;
  uploadPercent2 = null;

  errorFile1 = false;
  errorFile2 = false;

  statisticsMatching = [];
  multiParentsMatching = false;
  statisticsNotMatching1 = [];
  statisticsNotMatching2 = [];
  multiParentsNotMatching1 = false;
  multiParentsNotMatching2 = false;
  statisticsSkills = [];
  statisticsTransversalSkills = [];
  statisticsFields = [];

  statNumberOfConcepts1 = [];
  statNumberOfConcepts2 = [];

  modalRef: BsModalRef;
  myChart = null;
  notMatchChart1 = null;
  notMatchChart2 = null;
  isAnonymous = true;
  type = -1;
  type2 = -1;

  formGroup = this.fb.group({
    file: [null, Validators.required]
  });

  public LIMIT_PER_PAGE = 6;
  public paginationLimitFrom1 = 0;
  public paginationLimitFrom2 = 0;
  public paginationLimitTo1 = this.LIMIT_PER_PAGE;
  public paginationLimitTo2 = this.LIMIT_PER_PAGE;
  public currentPage1 = 0;
  public currentPage2 = 0;
  public collectionOT = 'Other';


  sortNameAsc1 = true;
  sortOrgAsc1 = true;
  sortUpdAsc1 = true;
  sortedBy1 = 'name';
  sorted = false;

  sortNameAsc2 = true;
  sortOrgAsc2 = true;
  sortUpdAsc2 = true;
  sortScoAsc2 = true;
  sortedBy2 = 'name';
  bokResources = false;

  @ViewChild('textBoK') textBoK: ElementRef;
  @ViewChild('graphTreeDiv') public graphTreeDiv: ElementRef;
  @ViewChild('bokModal') public bokModal: ModalDirective;
  @ViewChild('customBokModal') public customBokModal: ModalDirective;

  selectedNodes = [];
  hasResults = false;
  limitSearchFrom = 0;
  limitSearchTo = 10;
  searchInputField = '';
  currentConcept = 'GIST';

  customSelect = 0;
  buttonClear = 0;
  isLoaded = false;

  customBokModalConcept = '';
  subconceptsModal = [];
  isAbleToEditModal = false;

  constructor(
    private matchService: MatchService,
    private otherService: OtherService,
    private organizationService: OrganizationService,
    private userService: UserService,
    public fieldsService: FieldsService,
    public escoService: EscoCompetenceService,
    public resourceService: ResourceService,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private fb: FormBuilder,
    // private cd: ChangeDetectorRef,
    private storage: AngularFireStorage,
    public bokService: BokService,
    private modalService: BsModalService,
    private dijkstraService: DijkstraService,

  ) {
    this.isAnonymous = true;
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          if (this.currentUser.organizations && this.currentUser.organizations.length > 0) {
            this.currentUser.organizations.forEach(orgId => {
              this.organizationService.getOrganizationById(orgId).subscribe(org => {
                if (org) {
                  this.userOrgs.push(org);
                  this.saveOrg = this.userOrgs[0];
                  this.loadDivisions();
                  // remove private not your org resources
                  this.resourceService.allResources = this.resourceService.allResources.filter(
                    it =>
                      this.currentUser.organizations.includes(it.orgId) || it.isPublic
                  );
                  this.isAnonymous = false;
                }
              });
            });
          }
        });
      }
    });
    // sort resources by name
    // this.resourceService.allResources.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
    this.filteredResources1 = this.resourceService.publicResources;
    this.filteredResources2 = this.resourceService.publicResources;

  }

  ngOnInit() {
    this.getMode();
    const inputObject = {
      svgId: '#bubbles',
      textId: '#textBoK',
      urls: environment.URL_ARRAY
    };
    bok.visualizeBOKData(inputObject);
  }

  saveMatch() {
    if (this.mode === 'copy') {
      this.matchService.updateMatch(this._id, this.model);
    } else {
      this.model.userId = this.afAuth.auth.currentUser.uid;
      this.model.commonConcepts = this.commonBokConcepts;
      this.model.notMatchConcepts1 = this.notMatchConcepts1;
      this.model.notMatchConcepts2 = this.notMatchConcepts2;
      this.model.partialMatchConcepts1 = this.partialMatchConcepts1;
      this.model.partialMatchConcepts2 = this.partialMatchConcepts2;
      this.model.resource1 = this.resource1;
      this.model.resource2 = this.resource2;
      this.model.orgId = this.saveOrg._id;
      this.model.orgName = this.saveOrg.name;
      this.model.division = this.saveDiv;
      if (this.model.resource1._id == null) {
        this.model.resource1.type = 3;
        this.otherService.addNewOther(this.model.resource1);
      }
      if (this.model.resource2._id == null) {
        this.model.resource2.type = 3;
        this.otherService.addNewOther(this.model.resource2);
      }
      // reload resources
      this.resourceService.getResources();
      this.matchService.addNewMatch(this.model);
    }
  }

  getMode(): void {
    this.mode = this.route.snapshot.paramMap.get('mode');
    if (this.mode === 'duplicate' || this.mode === 'copy') {
      if (this.mode === 'copy') {
        this.title = 'Copy BoK Match';
      } else {
        this.title = 'Duplicate BoK Match';

      }
      this.getMatchId();
      this.fillForm();
    } else {
      this.title = 'Match two BoK resources';
    }
  }

  getMatchId(): void {
    this._id = this.route.snapshot.paramMap.get('name');
    this.matchService
      .getMatchById(this._id)
      .subscribe(m => (this.selectedMatch = m));
  }

  fillForm(): void {
    this.matchService
      .getMatchById(this._id)
      .subscribe(m => (this.model = m));
  }

  loadDivisions() {
    this.userDivisions = this.saveOrg.divisions ? this.saveOrg.divisions : [];
    this.saveDiv = this.model ? this.model.division ? this.model.division : '' : '';
  }

  filter1() {
    this.paginationLimitFrom1 = 0;
    this.paginationLimitTo1 = this.LIMIT_PER_PAGE;
    this.currentPage1 = 0;
    if (this.type === -1) {
      this.filteredByType1 = this.isAnonymous ? this.resourceService.publicResources : this.resourceService.allResources;
    }
    this.filteredResources1 = this.filteredByType1.filter(
      it =>
        it.name.toLowerCase().includes(this.searchText1.toLowerCase()) ||
        it.description.toLowerCase().includes(this.searchText1.toLowerCase()) ||
        it.orgName.toLowerCase().includes(this.searchText1.toLowerCase()) ||
        (it.division ? (it.division.toLowerCase().includes(this.searchText1.toLowerCase())) : false)
    );
  }

  filter2() {
    this.paginationLimitFrom2 = 0;
    this.paginationLimitTo2 = this.LIMIT_PER_PAGE;
    this.currentPage2 = 0;
    if (this.type2 === -1) {
      this.filteredByType2 = this.isAnonymous ? this.resourceService.publicResources : this.resourceService.allResources;
    }
    this.filteredResources2 = this.filteredByType2.filter(
      it =>
        it.name.toLowerCase().includes(this.searchText2.toLowerCase()) ||
        it.description.toLowerCase().includes(this.searchText2.toLowerCase()) ||
        it.orgName.toLowerCase().includes(this.searchText2.toLowerCase()) ||
        (it.division ? (it.division.toLowerCase().includes(this.searchText2.toLowerCase())) : false)
    );
  }

  onFileChange1(event) {
    // empty filtered resources to hide EO4GEO content
    //this.filteredResources1 = [];
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      [this.file1] = event.target.files;
      this.clearCustomSelection1();
      // console.log(this.file2);
      // upload file to firebase storage to be able to get metadata
      this.uploadFile1(this.file1);
      reader.readAsDataURL(this.file1);
      reader.onload = () => {
        this.formGroup.patchValue({
          file: reader.result
        });
      };
    }
  }

  onFileChange2(event) {
    // empty filtered resources to hide EO4GEO content
    //this.filteredResources2 = [];
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      [this.file2] = event.target.files;
      this.clearCustomSelection2();
      // console.log(this.file2);
      // upload file to firebase storage to be able to get metadata
      this.uploadFile2(this.file2);
      reader.readAsDataURL(this.file2);
      reader.onload = () => {
        this.formGroup.patchValue({
          file: reader.result
        });
      };
    }
  }

  selectResource1(res) {
    this.getRelations();
    this.notMatchConcepts1 = [];
    this.conceptsName = [];
    this.file1 = null;
    this.uploadPercent1 = null;
    this.bokConcepts1 = this.getBokConceptsFromResource(res);
    this.skills1 = this.getSkillsFromResource(res);
    this.fields1 = this.getFieldsFromResource(res);
    this.transversalSkills1 = this.getTransversalSkillsFromResource(res);
    this.bokConcepts1.forEach(k => {
      this.notMatchConcepts1.push(k);
      this.conceptsName[k.code] = k.name;
    });
    this.notMatchSkills1 = this.skills1;
    this.notMatchFields1 = this.fields1;
    this.notMatchTransversal1 = this.transversalSkills1;
    this.resource1 = res;
    this.cleanSelection2();
    this.match();
    this.getStatisticsNumberOfConcepts();
    this.calculateMatchScore();
  }

  selectResource2(res) {
    this.getRelations();
    this.notMatchConcepts2 = [];
    this.conceptsName = [];
    this.file2 = null;
    this.uploadPercent2 = null;
    this.bokConcepts2 = this.getBokConceptsFromResource(res);
    this.skills2 = this.getSkillsFromResource(res);
    this.fields2 = this.getFieldsFromResource(res);
    this.transversalSkills2 = this.getTransversalSkillsFromResource(res);
    this.bokConcepts2.forEach(k => {
      this.notMatchConcepts2.push(k);
      this.conceptsName[k.code] = k.name;
    });
    this.notMatchSkills2 = this.skills2;
    this.notMatchFields2 = this.fields2;
    this.notMatchTransversal2 = this.transversalSkills2;
    this.resource2 = res;
    this.match();
    this.getStatisticsNumberOfConcepts();
  }

  uploadFile1(file) {
    //pdfjs.GlobalWorkerOptions.workerSrc = pdfjsworker;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
    const filePath = 'other/custom-' + encodeURI(file.name);
    // upload file to firebase storage
    const task = this.storage.upload(filePath, file);
    this.errorFile1 = false;
    // observe percentage changes
    this.uploadPercent1 = task.percentageChanges();
    // get notified when the download URL is available
    task.snapshotChanges().pipe(
      finalize(() => {
        // take storage reference to download file
        const ref = this.storage.ref(filePath);
        ref.getDownloadURL().subscribe(url => {
          // get pdf document from url
          const loadingTask = pdfjs.getDocument(url);
          loadingTask.promise.then(pdfDoc_ => {
            // pdfjs.getDocument(url).then(pdfDoc_ => {
            const pdfDoc = pdfDoc_;
            // get metadata from pdf document
            pdfDoc.getMetadata().then(metadataObject => {
              this.meta1 = metadataObject;
              // save in bokconcepts the concetps from pdf metadata
              const title = this.getTitle(this.meta1);
              this.bokConcepts1 = this.getBokConceptsFromMeta(this.meta1);
              if (this.bokConcepts1.length === 0) {
                this.errorFile1 = true;
              }
              const conceptsString = [];
              this.bokConcepts1.forEach(k => {
                this.notMatchConcepts1.push(k);
                conceptsString.push(k.name);
              });
              this.resource1 = new Resource(null, url, this.currentUser ? this.currentUser._id : '',
                this.saveOrg ? this.saveOrg._id : '', this.saveOrg ? this.saveOrg.name : '', '', this.collectionOT,
                this.collectionOT, true, true, title ? title : 'Not title', title ? title : 'Not title', '',
                conceptsString, null, null, null, conceptsString, 3, null, 0);
              // do the matching
              this.match();
              this.calculateMatchScore();
            }).catch(function (err) {
              console.log('Error getting meta data');
              console.log(err);
            });
          }).catch(function (err) {
            console.log('Error getting PDF from url');
            console.log(err);
          });
        });
      })
    )
      .subscribe();
  }

  uploadFile2(file) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
    //pdfjs.GlobalWorkerOptions.workerSrc = pdfjsworker;
    const filePath = 'other/custom-' + encodeURI(file.name);
    const task = this.storage.upload(filePath, file);

    this.errorFile2 = false;
    this.uploadPercent2 = task.percentageChanges();
    task.snapshotChanges().pipe(
      finalize(() => {
        const ref = this.storage.ref(filePath);
        ref.getDownloadURL().subscribe(url => {
         // pdfjs.getDocument(url).then(pdfDoc_ => {
            const loadingTask = pdfjs.getDocument(url);
            loadingTask.promise.then(pdfDoc_ => {
            const pdfDoc = pdfDoc_;
            pdfDoc.getMetadata().then(metadataObject => {
              this.meta2 = metadataObject;
              console.log(this.meta2); // Metadata object here
              const title = this.getTitle(this.meta2);
              this.bokConcepts2 = this.getBokConceptsFromMeta(this.meta2);
              if (this.bokConcepts2.length === 0) {
                this.errorFile2 = true;
              }
              this.bokConcepts2.forEach(k => {
                this.notMatchConcepts2.push(k);
              });
              this.resource2 = new Resource(null, url, this.currentUser ? this.currentUser._id : '',
                this.saveOrg ? this.saveOrg._id : '', this.saveOrg ? this.saveOrg.name : '', '', this.collectionOT,
                this.collectionOT, true, true, title ? title : 'Not title', title ? title : 'Not title', '',
                this.bokConcepts2, null, null, null, null, 3, null, 0);
              this.match();
            }).catch(function (err) {
              console.log('Error getting meta data');
              console.log(err);
            });
          }).catch(function (err) {
            console.log('Error getting PDF from url');
            console.log(err);
          });
        });
      })
    )
      .subscribe();
  }


  getTitle(meta) {
    let title = '';
    // concepts are in Subject metadata
    if (meta && meta.info && meta.info.Subject) {
      const rdf = meta.info.Subject.split(';');
      rdf.forEach(rdfEl => {
        if ( rdfEl.indexOf('title') >= 0) {
          const rel = rdfEl.split('dc:title ');
          title = rel[1].replace('.pdf', '').replace('"', '').replace('"', '');
        }
      });
    }
    return title;
  }
  getBokConceptsFromMeta(meta) {
    const concepts = [];
    // concepts are in Subject metadata
    if (meta && meta.info && meta.info.Subject) {
      const rdf = meta.info.Subject.split(' ');
      rdf.forEach(rdfEl => {
        const rel = rdfEl.split(':');
        // if it's a eo4geo concept save the code
        if (rel[0] === 'eo4geo') {
          if (rel[1] !== '') {
            if (rel[1].endsWith(';')) {
              // tslint:disable-next-line:max-line-length  '[' + rel[1].slice(0, -1) + '] '
              concepts.push({ code: rel[1].slice(0, -1), name: '[' + rel[1].slice(0, -1) + '] ' + this.bokService.getConceptInfoByCode(rel[1].slice(0, -1)).name });
            } else {
              concepts.push({ code: rel[1], name: '[' + rel[1] + '] ' + this.bokService.getConceptInfoByCode(rel[1]).name });
            }
          }
        }
      });
    }
    return concepts;
  }

  getBokConceptsFromResource(res) {
    // get concepts from resource in our database
    const concepts = [];
    const codConcepts = [];
    if (res && res.concepts && res.concepts.length > 0) {
      res.concepts.forEach(c => {
        const rel = c.split(']');
        if (rel.length > 1) {
          if (rel[0][0] === '[') {
            const concept = rel[0].slice(1);
            if (codConcepts.indexOf(concept) === -1) {
              let na = c;
              if (rel[1].length < 2) {
                na = rel[0] + ' ' + this.bokService.getConceptInfoByCode(rel[0]).name;
              }
              concepts.push({ code: concept, name: na });
              codConcepts.push(rel[0].slice(1));
            }
          } else {
            // get names from service when not present
            concepts.push({ code: rel[0], name: '[' + rel[0] + '] ' + this.bokService.getConceptInfoByCode(rel[0]).name });
            codConcepts.push(rel[0]);
          }
        } else {
          concepts.push({ code: c, name: '[' + c + '] ' + this.bokService.getConceptInfoByCode(c).name });
          codConcepts.push(c);
        }
      });
    }
    return concepts;
  }

  getSkillsFromResource(res) {
    const skills = [];
    if (res.type === 0) {
      if (res && res.learningObjectives && res.learningObjectives.length > 0) {
        res.learningObjectives.forEach(c => {
          let skill = '';
          skill = c.name;
          skills.push(skill);
        });
      }
    } else {
      if (res && res.skills && res.skills.length > 0) {
        res.skills.forEach(c => {
          skills.push(c);
        });
      }
    }
    return skills;
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
    } else if (!res.fields && res.occuProf) {
      fields.push(res.occuProf.field.name);
    } else if (!res.fields && res.field) {
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
    } else if (res.competences && res.competences.preferredLabel && !res.occuProf) {
      transversalSkills.push(res.occuProf.competences.preferredLabel);
    }
    return transversalSkills;
  }
  match() {
    this.commonBokConcepts = [];
    if (this.bokConcepts1.length > 0 || this.bokConcepts2.length > 0) {
      this.notMatchConcepts1 = [];
      this.notMatchConcepts2 = [];
      this.partialMatchConcepts1 = [];
      this.partialMatchConcepts2 = [];

      // Create distanceMaps
      const distancesMap1: Map<string, Map<string, number>> = new Map();
      this.bokConcepts1.forEach(value => {
        distancesMap1.set(value.code, this.dijkstraService.getDistanceMap(value.code, this.matchingFlexibility));
      });

      const distancesMap2: Map<string, Map<string, number>> = new Map();
      this.bokConcepts2.forEach(value => {
        if (!distancesMap1.has(value.code)){
          distancesMap2.set(value.code, this.dijkstraService.getDistanceMap(value.code, this.matchingFlexibility));
        } else {
          distancesMap2.set(value.code, distancesMap1.get(value.code));
        }
      });

      // Match concepts using distanceMaps
      const matchMap: Map<string, number> = new Map();
      this.bokConcepts1.forEach(value => {
        distancesMap2.forEach((map: Map<string, number>, key: string) => {
          if(map.has(value.code)) {
            const newDistance: number = map.get(value.code);
            if(!matchMap.has(value.code) || matchMap.get(value.code) < newDistance){
              matchMap.set(value.code, newDistance);
            }
          }
        });
        if(!matchMap.has(value.code)){
          this.notMatchConcepts1.push(value);
        } else if (matchMap.get(value.code) !== 100) {
          value.partialMatch = matchMap.get(value.code);
          this.partialMatchConcepts1.push(value);
        } else {
          this.commonBokConcepts.push(value);
        }
      });

      this.bokConcepts2.forEach(value => {
        distancesMap1.forEach((map: Map<string, number>, key) => {
          if(map.has(value.code)) {
            const newDistance: number = map.get(value.code);
            if(!matchMap.has(value.code) || matchMap.get(value.code) < newDistance){
              matchMap.set(value.code, newDistance);
            }
          }
        });
        if(!matchMap.has(value.code)){
          this.notMatchConcepts2.push(value);
        } else if (matchMap.get(value.code) !== 100) {
          value.partialMatch = matchMap.get(value.code);
          this.partialMatchConcepts2.push(value);
        } else {
          this.commonBokConcepts.push(value);
        }
      });

      const commonConceptsSet = new Set<string>();
      const uniqueCommonConcepts = [];
      for(let i = 0; i<this.commonBokConcepts.length; i++) {
        const concept = this.commonBokConcepts[i];
        if (!commonConceptsSet.has(concept.code)) {
          commonConceptsSet.add(concept.code);
          uniqueCommonConcepts.push(concept);
        }
      }
      this.commonBokConcepts = uniqueCommonConcepts;


      this.commonBokConcepts.sort((a, b) => (a.code > b.code) ? 1 : -1);
      this.partialMatchConcepts1.sort((a, b) => (a.code > b.code) ? 1 : -1);
      this.partialMatchConcepts2.sort((a, b) => (a.code > b.code) ? 1 : -1);

      this.notMatchConcepts1.sort((a, b) => (a.code > b.code) ? 1 : -1);
      this.notMatchConcepts2.sort((a, b) => (a.code > b.code) ? 1 : -1);
    }
    this.commonSkills = [];
    if (this.skills1.length > 0 && this.skills2.length > 0) {
      this.notMatchSkills1 = [];
      this.notMatchSkills2 = [];
      this.skills1.forEach(bok1 => {
        if (this.skills2.indexOf(bok1) !== -1) {
          this.commonSkills.push(bok1);
        } else {
          this.notMatchSkills1.push(bok1);
        }
      });
      this.skills2.forEach(bok1 => {
        if (this.commonSkills.indexOf(bok1) < 0) {
          this.notMatchSkills2.push(bok1);
        }
      });
      this.commonSkills.sort();
    }

    this.commonFields = [];
    if (this.fields1.length > 0 && this.fields2.length > 0) {
      this.notMatchFields1 = [];
      this.notMatchFields2 = [];
      this.fields1.forEach(bok1 => {
        if (this.fields2.indexOf(bok1) !== -1) {
          this.commonFields.push(bok1);
        } else {
          this.notMatchFields1.push(bok1);
        }
      });
      this.fields2.forEach(bok1 => {
        if (this.commonFields.indexOf(bok1) < 0) {
          this.notMatchFields2.push(bok1);
        }
      });
      this.commonFields.sort();
    }

    this.commonTransversalSkills = [];
    if (this.transversalSkills1.length > 0 && this.transversalSkills2.length > 0) {
      this.notMatchTransversal1 = [];
      this.notMatchTransversal2 = [];
      this.transversalSkills1.forEach(bok1 => {
        if (this.transversalSkills2.indexOf(bok1) !== -1) {
          this.commonTransversalSkills.push(bok1);
        } else {
          this.notMatchTransversal1.push(bok1);
        }
      });
      this.transversalSkills2.forEach(bok1 => {
        if (this.commonTransversalSkills.indexOf(bok1) < 0) {
          this.notMatchTransversal2.push(bok1);
        }
      });
      this.commonTransversalSkills.sort();
    }

    this.calculateStatistics();
  }

  calculateStatistics() {
    this.statisticsMatching = [];
    this.multiParentsMatching = false;
    if (this.commonBokConcepts) {
      const tempStats = {};
      let tempTotal = 0;
      this.commonBokConcepts.forEach(kn => {
        let codes: Set<string> = this.dijkstraService.getParents(kn.code);
        if (codes.size > 1) this.multiParentsMatching = true;
        codes.forEach( code => {
          tempStats[code] !== undefined ? tempStats[code]++ : tempStats[code] = 1;
          tempTotal++;
        });
      });
      Object.keys(tempStats).forEach(k => {
        const nameKA = k + ' - ' + this.dijkstraService.getTreeNode(k).name;
        this.statisticsMatching.push({ code: nameKA, value: Math.round(tempStats[k] * 100 / tempTotal), count: tempStats[k] });
      });
      this.graphStatistics(this.statisticsMatching, 'myChart');
      this.calculateNotmatchingStatistics();
      this.calculateSkillsStatistics();
      this.calculateFieldsStatistics();
    }
  }

  calculateNotmatchingStatistics() {
    this.statisticsNotMatching1 = [];
    this.statisticsNotMatching2 = [];
    this.multiParentsNotMatching1 = false;
    this.multiParentsNotMatching2 = false;
    if (this.commonBokConcepts) {
      const tempStats2 = {};
      let tempTotal2 = 0;
      this.notMatchConcepts1.forEach(nc => {
        let codes: Set<string> = this.dijkstraService.getParents(nc.code);
        if (codes.size > 1) this.multiParentsNotMatching1 = true;
        codes.forEach( code => {
          tempStats2[code] !== undefined ? tempStats2[code]++ : tempStats2[code] = 1;
          tempTotal2++;
        });
      });
      Object.keys(tempStats2).forEach(k => {
        const nameKA = k + ' - ' + this.dijkstraService.getTreeNode(k).name;
        this.statisticsNotMatching1.push({ code: nameKA, value: Math.round(tempStats2[k] * 100 / tempTotal2), count: tempStats2[k] });
      });
      const tempStats3 = {};
      let tempTotal3 = 0;
      this.notMatchConcepts2.forEach(nc => {
        let codes: Set<string> = this.dijkstraService.getParents(nc.code);
        if (codes.size > 1) this.multiParentsNotMatching2 = true;
        codes.forEach( code => {
          tempStats3[code] !== undefined ? tempStats3[code]++ : tempStats3[code] = 1;
          tempTotal3++;
        });
      });
      Object.keys(tempStats3).forEach(k => {
        const nameKA = k + ' - ' + this.dijkstraService.getTreeNode(k).name;
        this.statisticsNotMatching2.push({ code: nameKA, value: Math.round(tempStats3[k] * 100 / tempTotal3), count: tempStats3[k] });
      });
    }
    this.graphStatisticsNotMatch1(this.statisticsNotMatching1, 'notMatch1');
    this.graphStatisticsNotMatch2(this.statisticsNotMatching2, 'notMatch2');
  }
  calculateSkillsStatistics() {
    this.statisticsSkills = [];
    if (this.commonSkills) {
      const tempStats = {};
      let tempTotal = 0;
      this.commonSkills.forEach(nc => {
        let codes: Set<string> = this.dijkstraService.getParents(nc.code);
        codes.forEach( code => {
          tempStats[code] !== undefined ? tempStats[code]++ : tempStats[code] = 1;
          tempTotal++;
        });
      });
      Object.keys(tempStats).forEach(k => {
        const nameKA = k + ' - ' + this.dijkstraService.getTreeNode(k).name;
        this.statisticsSkills.push({ code: nameKA, value: Math.round(tempStats[k] * 100 / tempTotal) });
      });
    }
  }
  calculateFieldsStatistics() {
    this.statisticsFields = [];
    if (this.commonFields) {
      const tempStats = {};
      let tempTotal = 0;
      this.commonFields.forEach(nc => {
        const code = nc;
        tempStats[code] !== undefined ? tempStats[code]++ : tempStats[code] = 1;
        tempTotal++;
      });
      Object.keys(tempStats).forEach(k => {
        this.statisticsFields.push({ code: k, value: Math.round(tempStats[k] * 100 / tempTotal) });
      });
    }
  }
  range(size, startAt = 0) {
    size = Math.ceil(size);
    if (size === 0) {
      size = 1;
    }
    return [...Array(size).keys()].map(i => i + startAt);
  }

  int(number) {
    return Math.round(number);
  }

  nextPage1() {
    if (this.currentPage1 + 1 < this.filteredResources1.length / this.LIMIT_PER_PAGE) {
      this.paginationLimitFrom1 = this.paginationLimitFrom1 + this.LIMIT_PER_PAGE;
      this.paginationLimitTo1 = this.paginationLimitTo1 + this.LIMIT_PER_PAGE;
      this.currentPage1++;
    }
  }

  previousPage1() {
    if (this.currentPage1 > 0) {
      this.paginationLimitFrom1 = this.paginationLimitFrom1 - this.LIMIT_PER_PAGE;
      this.paginationLimitTo1 = this.paginationLimitTo1 - this.LIMIT_PER_PAGE;
      this.currentPage1--;
    }
  }
  nextPage2() {
    if (this.currentPage2 + 1 < this.filteredResources1.length / this.LIMIT_PER_PAGE) {
      this.paginationLimitFrom2 = this.paginationLimitFrom2 + this.LIMIT_PER_PAGE;
      this.paginationLimitTo2 = this.paginationLimitTo2 + this.LIMIT_PER_PAGE;
      this.currentPage2++;
    }
  }

  previousPage2() {
    if (this.currentPage2 > 0) {
      this.paginationLimitFrom2 = this.paginationLimitFrom2 - this.LIMIT_PER_PAGE;
      this.paginationLimitTo2 = this.paginationLimitTo2 - this.LIMIT_PER_PAGE;
      this.currentPage2--;
    }
  }

  filterByType(array, type) {
    if (array === 1) {
      this.paginationLimitFrom1 = 0;
      this.paginationLimitTo1 = this.LIMIT_PER_PAGE;
      this.currentPage1 = 0;
      this.filteredResources1 = [];
      if (type === -1) {
        // tslint:disable-next-line:max-line-length
        this.filteredResources1 = this.isAnonymous ? Object.assign([], this.resourceService.publicResources) : Object.assign([], this.resourceService.allResources);
      } else {
        // tslint:disable-next-line:max-line-length
        this.filteredResources1 = this.isAnonymous ? Object.assign([], this.resourceService.publicResources) : Object.assign([], this.resourceService.allResources);
        const filtered = this.filteredResources1.filter(
          it =>
            it.type === type
        );
        this.filteredByType1 = filtered;
        this.filteredResources1 = filtered;
      }
      this.type = type;
    } else {
      this.paginationLimitFrom2 = 0;
      this.paginationLimitTo2 = this.LIMIT_PER_PAGE;
      this.currentPage2 = 0;
      this.filteredResources2 = [];
      if (type === -1) {
        // tslint:disable-next-line:max-line-length
        this.filteredResources2 = this.isAnonymous ? Object.assign([], this.resourceService.publicResources) : Object.assign([], this.resourceService.allResources);
      } else {
        // tslint:disable-next-line:max-line-length
        this.filteredResources2 = this.isAnonymous ? Object.assign([], this.resourceService.publicResources) : Object.assign([], this.resourceService.allResources);
        const filtered = this.filteredResources2.filter(
          it =>
            it.type === type
        );
        this.filteredByType2 = filtered;
        this.filteredResources2 = filtered;
      }
      this.type2 = type;
    }
  }

  deleteOtherRes(idOther) {
    this.otherService.removeOther(idOther);

    console.log('delete other resource: ' + idOther);

    this.resourceService.allResources = this.resourceService.allResources.filter(
      it =>
        it._id !== idOther
    );
    this.resourceService.publicResources = this.resourceService.publicResources.filter(
      it =>
        it._id !== idOther
    );
    this.filteredResources1 = this.filteredResources1.filter(
      it =>
        it._id !== idOther
    );
    this.filteredResources2 = this.filteredResources2.filter(
      it =>
        it._id !== idOther
    );

  }
  openModal() {
    this.modalRef = this.modalService.show(LoginComponent, { class: 'modal-lg' });
  }

  graphStatistics(statistics, chartId) {
    if (this.myChart !== null) {
      this.myChart.destroy();
    }
    if (statistics.length > 0) {
      const ctx = document.getElementById(chartId);
      const dataToGraph = [];
      const labelsToGraph = [];
      const colorsToGraph = [];
      statistics.forEach(st => {
        dataToGraph.push(st.count);
        labelsToGraph.push(st.code);
        colorsToGraph.push(this.getColor(st.code.slice(0, 2)));
      });
      this.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: dataToGraph,
            backgroundColor: colorsToGraph
          }],
          labels: labelsToGraph
        },
        options: {
        }
      });
    }
  }

  graphStatisticsNotMatch1(statistics, chartId) {
    if (this.notMatchChart1 !== null) {
      this.notMatchChart1.destroy();
    }
    const ctx = document.getElementById(chartId);
    const dataToGraph = [];
    const labelsToGraph = [];
    const colorsToGraph = [];
    statistics.forEach(st => {
      dataToGraph.push(st.count);
      labelsToGraph.push(st.code);
      colorsToGraph.push(this.getColor(st.code.slice(0, 2)));
    });
    this.notMatchChart1 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: dataToGraph,
          backgroundColor: colorsToGraph
        }],
        labels: labelsToGraph
      },
      options: {
      }
    });
  }
  graphStatisticsNotMatch2(statistics, chartId) {
    if (this.notMatchChart2 !== null) {
      this.notMatchChart2.destroy();
    }
    const ctx = document.getElementById(chartId);
    const dataToGraph = [];
    const labelsToGraph = [];
    const colorsToGraph = [];
    statistics.forEach(st => {
      dataToGraph.push(st.count);
      labelsToGraph.push(st.code);
      colorsToGraph.push(this.getColor(st.code.slice(0, 2)));
    });
    this.notMatchChart2 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: dataToGraph,
          backgroundColor: colorsToGraph
        }],
        labels: labelsToGraph
      },
      options: {
      }
    });
  }
  getColor(code) {
    const colors = {
      'bok-GI': '#40e0d0',
      'bok-IP': '#1f77b4',
      'bok-CF': '#aec7e8',
      'bok-CV': '#ff7f0e',
      'bok-DA': '#ffbb78',
      'bok-DM': '#2ca02c',
      'bok-DN': '#98df8a',
      'bok-PS': '#d62728',
      'bok-GD': '#cc5b59',
      'bok-GS': '#9467bd',
      'bok-AM': '#8c564b',
      'bok-MD': '#8c564b',
      'bok-OI': '#c49c94',
      'bok-GC': '#e377c2',
      'bok-PP': '#f7b6d2',
      'bok-SD': '#7f7f7f',
      'bok-SH': '#c7c7c7',
      'bok-TA': '#bcbd22',
      'bok-WB': '#07561e',
      'bok-GN' : "#1ca8dd",
      'bok-SC' : "#ffcc00",
      'bok-SA' : "#ff9f4a",
      'bok-no': '#17becf',
    };
    return colors['bok-' + code];
  }

  getRelations() {
    if (this.allConcepts.length === 0) {
      const allConcepts = this.bokService.getConcepts();
      const allRelations = this.bokService.getRelations();
      this.allConcepts = this.bokService.getRelationsPrent(allRelations, allConcepts);
    }
  }


  getStatisticsNumberOfConcepts() {
    this.numberOfConcepts1 = this.getNumberOfConcepts(this.bokConcepts1);
    this.numberOfConcepts2 = this.getNumberOfConcepts(this.bokConcepts2);
    let numberCommonConcepts = [];
    numberCommonConcepts = this.getNumberOfConcepts(this.commonBokConcepts);
    this.statNumberOfConcepts1 = [];
    this.statNumberOfConcepts2 = [];
    let percentage1 = 0;
    let percentage2 = 0;
    Object.keys(numberCommonConcepts).forEach(bokConcept => {

      percentage1 = (Math.round((numberCommonConcepts[bokConcept] * 100) / this.numberOfConcepts1[bokConcept]));
      this.statNumberOfConcepts1.push({
        code: bokConcept, value: percentage1, numberCommon: numberCommonConcepts[bokConcept],
        numberCon: this.numberOfConcepts1[bokConcept]
      });

      percentage2 = (Math.round((numberCommonConcepts[bokConcept] * 100) / this.numberOfConcepts2[bokConcept]));
      this.statNumberOfConcepts2.push({
        code: bokConcept, value: percentage2, numberCommon: numberCommonConcepts[bokConcept],
        numberCon: this.numberOfConcepts2[bokConcept]
      });
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

  sortBy1(attr) {
    this.filteredResources1 = Object.assign([], this.filteredResources1);
    this.paginationLimitFrom1 = 0;
    this.paginationLimitTo1 = this.LIMIT_PER_PAGE;
    this.currentPage1 = 0;
    switch (attr) {
      case 'name':
        this.sortNameAsc1 = !this.sortNameAsc1;
        this.sortedBy1 = 'name';
        // tslint:disable-next-line:max-line-length
        this.filteredResources1.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? this.sortNameAsc1 ? 1 : -1 : this.sortNameAsc1 ? -1 : 1);
        break;
      case 'lastUpdated':
        this.sortUpdAsc1 = !this.sortUpdAsc1;
        this.sortedBy1 = 'lastUpdated';
        this.filteredResources1.sort((a, b) => (a.updatedAt > b.updatedAt) ? this.sortUpdAsc1 ? 1 : -1 : this.sortUpdAsc1 ? -1 : 1);
        break;
      case 'organization':
        this.sortOrgAsc1 = !this.sortOrgAsc1;
        this.sortedBy1 = 'organization';
        // tslint:disable-next-line:max-line-length
        this.filteredResources1.sort((a, b) => (a.orgName + (a.division ? a.division : '') > b.orgName + (b.division ? b.division : '')) ? this.sortOrgAsc1 ? 1 : -1 : this.sortOrgAsc1 ? -1 : 1);
        break;
    }
  }

  sortBy2(attr) {
    this.filteredResources2 = Object.assign([], this.filteredResources2);
    this.paginationLimitFrom2 = 0;
    this.paginationLimitTo2 = this.LIMIT_PER_PAGE;
    this.currentPage2 = 0;
    this.sorted = true;
    switch (attr) {
      case 'name':
        this.sortNameAsc2 = !this.sortNameAsc2;
        this.sortedBy2 = 'name';
        // tslint:disable-next-line:max-line-length
        this.filteredResources2.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? this.sortNameAsc2 ? 1 : -1 : this.sortNameAsc2 ? -1 : 1);
        break;
      case 'lastUpdated':
        this.sortUpdAsc2 = !this.sortUpdAsc2;
        this.sortedBy2 = 'lastUpdated';
        this.filteredResources2.sort((a, b) => (a.updatedAt > b.updatedAt) ? this.sortUpdAsc2 ? 1 : -1 : this.sortUpdAsc2 ? -1 : 1);
        break;
      case 'organization':
        this.sortOrgAsc2 = !this.sortOrgAsc2;
        this.sortedBy2 = 'organization';
        // tslint:disable-next-line:max-line-length
        this.filteredResources2.sort((a, b) => (a.orgName + (a.division ? a.division : '') > b.orgName + (b.division ? b.division : '')) ? this.sortOrgAsc1 ? 1 : -1 : this.sortOrgAsc1 ? -1 : 1);
        break;
      case 'score':
        this.sortScoAsc2 = !this.sortScoAsc2;
        this.sortedBy2 = 'score';
        // tslint:disable-next-line:max-line-length
        this.filteredResources2.sort((a, b) => (a.score > b.score) ? this.sortScoAsc2 ? 1 : -1 : this.sortScoAsc2 ? -1 : 1);
        break;
    }
  }

  searchInBok(text: string) {
    if (text === '' || text === ' ') {
      this.cleanResults();
    } else {
      this.selectedNodes = bok.searchInBoK(text);
      this.hasResults = true;
      this.currentConcept = '';

      this.limitSearchFrom = 0;
      this.limitSearchTo = 10;
    }
  }

  navigateToConcept(conceptName) {
    bok.browseToConcept(conceptName);
    console.log('Current concept: ' + conceptName);
    this.currentConcept = conceptName;
    this.hasResults = false;
  }

  cleanResults() {
    this.searchInputField = '';
    bok.searchInBoK('');
    this.navigateToConcept('GIST');
  }

  incrementLimit() {
    this.limitSearchTo = this.limitSearchTo + 10;
    this.limitSearchFrom = this.limitSearchFrom + 10;
  }

  decrementLimit() {
    this.limitSearchTo = this.limitSearchTo - 10;
    this.limitSearchFrom = this.limitSearchFrom - 10;
  }


  getNode(code) {
    const arrayRes = this.allConcepts.filter(
      it =>
        it.code.toLowerCase() === code.toLowerCase()
    );
    if (arrayRes.length > 0) {
      return arrayRes[0];
    } else {
      return null;
    }
  }

  addBokKnowledge() {
    this.getRelations();
    this.conceptsName = [];

    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    const conceptId = concept.split(']')[0].substring(1);

    if (this.customSelect === 1) {
      this.notMatchConcepts1 = [];
      this.bokConcepts1.push({ code: conceptId, name: concept});
      if (this.resource1 == null || this.resource1.name !== 'Custom selection') {
        this.resource1 = { name: 'Custom selection', concepts: [] };
      }
      this.resource1.concepts.push(concept);

    } else {
      this.notMatchConcepts2 = [];
      this.bokConcepts2.push({ code: conceptId, name: concept});
      if (this.resource2 == null || this.resource2.name !== 'Custom selection') {
        this.resource2 = { name: 'Custom selection', concepts: [] };
      }
      this.resource2.concepts.push(concept);
    }

    this.match();
    this.getStatisticsNumberOfConcepts();

    this.calculateMatchScore();
  }

  clearCustomSelection1() {
    if ((this.resource1 && this.resource1.name !== 'Custom selection') || this.buttonClear === 1) {
      this.resource1 = null;
      this.bokConcepts1 = [];
      this.skills1 = [];
      this.notMatchConcepts1 = [];
      this.notMatchFields1 = [];
      this.notMatchSkills1 = [];
      this.notMatchTransversal1 = [];
      this.commonBokConcepts = [];
      this.commonFields = [];
      this.commonSkills = [];
      this.commonTransversalSkills = [];
      this.buttonClear = 0;
      this.getStatisticsNumberOfConcepts();
      this.match();
    }
  }

  clearCustomSelection2() {
    if ((this.resource2 && this.resource2.name !== 'Custom selection') || this.buttonClear === 2) {
      this.resource2 = null;
      this.bokConcepts2 = [];
      this.skills2 = [];
      this.notMatchConcepts2 = [];
      this.notMatchFields2 = [];
      this.notMatchSkills2 = [];
      this.notMatchTransversal2 = [];
      this.commonBokConcepts = [];
      this.commonFields = [];
      this.commonSkills = [];
      this.commonTransversalSkills = [];
      this.buttonClear = 0;
      this.getStatisticsNumberOfConcepts();
      this.match();
    }
  }

  removeCustomConcept1(concept) {
    const index = this.bokConcepts1.indexOf(concept);
    this.bokConcepts1.splice(index, 1);
    this.resource1.concepts.splice(index, 1);
    this.notMatchConcepts1.splice(index, 1);
    this.getStatisticsNumberOfConcepts();
    this.match();
  }

  removeCustomConcept2(concept) {
    const index = this.bokConcepts2.indexOf(concept);
    this.bokConcepts2.splice(index, 1);
    this.resource2.concepts.splice(index, 1);
    this.notMatchConcepts2.splice(index, 1);
    this.getStatisticsNumberOfConcepts();
    this.match();
  }

  calculateMatchScore() {
    const tempfilter1 = this.filteredResources1;
    this.filteredResources1 = [];
    if (this.resource1 /*&& this.resource1.concepts.length > 0*/) {
      this.filteredResources2.forEach(res => {
        if (res.concepts.length > 0) {
          const found = [];
          res.concepts.forEach(c => {
            if (this.resource1.concepts.length > 0 && this.resource1.concepts.indexOf(c) > -1) {
              found.push(c);
            }
          });
          if (found.length > 0) {
            const score = Math.round((found.length * 100) / res.concepts.length);
            res.score = score > 100 ? 100 : score;
          } else {
            res.score = 0;
          }
        } else {
          res.score = 0;
        }
      });
    }
    tempfilter1.forEach(res => {
      this.filteredResources1.push(res);
    });
    if (!this.sorted || this.sortedBy2 === 'score') {
      this.filteredResources2.sort((a, b) => b.score - a.score);
      this.sortedBy2 = 'score';
      this.sortScoAsc2 = false;
    }
  }

  cleanSelection2() {
    this.resource2 = null;
    this.bokConcepts2 = [];
    this.skills2 = [];
    this.fields2 = [];
    this.transversalSkills2 = [];
    this.notMatchConcepts2 = [];
    this.notMatchFields2 = [];
    this.notMatchSkills2 = [];
    this.notMatchTransversal2 = [];
    this.commonBokConcepts = [];
    this.commonFields = [];
    this.commonSkills = [];
    this.commonTransversalSkills = [];
  }
}
