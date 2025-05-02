import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Resource, TrainingMaterial} from '../model/resources.model';
import {HttpClient} from '@angular/common/http';
import * as firebase from 'firebase';
import {BokService} from './bok.service';

const collectionJO = 'JobOffers';
const collectionOP = 'OcuProfiles';
const collectionSP = 'StudyPrograms';
const collectionJODisplay = 'Job Offer';
const collectionOPDisplay = 'Occupational Profile';
const collectionSPDisplay = 'Educational Offer';
const collectionOT = 'Other';
const collectionTM = 'TrainingMaterials';
const urlJOT = 'https://eo4geo-jot.web.app/#/detail/';
const urlCDT = 'https://eo4geo-cdt.web.app/detail/';
const urlOPT = 'https://eo4geo-opt.web.app/#/detail/';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private db: AngularFirestore;

  public allResources = [];
  public publicResources = [];
  public tmUpdated = true;
  public traininMaterial = [];
  constructor(db: AngularFirestore,  public bokService: BokService, private http: HttpClient) {
    this.db = db;
    //this.getTrainingMaterials();
    this.getResources();
  }

  getResources() {
    this.allResources = [];
    this.publicResources = [];
    // get Training Materials
    const tmSubs = this.db
      .collection<Resource>(collectionTM)
      .valueChanges().subscribe(rs => {
        rs.forEach(r => {
          r.collection = collectionTM;
          r.collectionDisplay = collectionTM;
          r.name = r.title === '' ? 'Unname training material' : r.title;
          r.division = r.division ? r.division : '';
          r.type = 4;
          r.description = r.description.slice(0, 100) + '[...]'; // truncate description
          this.allResources.push(r);
          if (r.isPublic && r.title !== '') { // temp: change when the github file is full
            this.publicResources.push(r);
          }
        });
        tmSubs.unsubscribe();
        this.sortedByName();
      });
    // get Job Offers
    const joSubs = this.db
      .collection<Resource>(collectionJO)
      .valueChanges().subscribe(rs => {
        rs.forEach(r => {
          r.collection = collectionJO;
          r.collectionDisplay = collectionJODisplay;
          r.concepts = r.occuProf.knowledge;
          r.skills = r.occuProf.skills;
          // r.fields = r.occuProf.fields;
          r.name = r.occuProf.title;
          r.eqf = r.occuProf.eqf;
          r.url = urlJOT + r._id;
          r.division = r.division ? r.division : '';
          r.type = 2;
          r.description = r.occuProf.description.slice(0, 100) + '[...]'; // truncate description
          this.allResources.push(r);
          if (r.isPublic) {
            this.publicResources.push(r);
          }
        });
        joSubs.unsubscribe();
        this.sortedByName();
      });

    // get Study Programs
    const spSubs = this.db
      .collection<Resource>(collectionSP)
      .valueChanges().subscribe(rs => {
        rs.forEach(r => {
          r.collection = collectionSP;
          r.collectionDisplay = collectionSPDisplay;
          r.url = urlCDT + r._id;
          r.division = r.division ? r.division : '';
          r.type = 0;
          r.isPublic = r.levelPublic;
          r.description = r.description.slice(0, 100) + '[...]'; // truncate description
          if ( r.concepts && r.concepts.length > 0 ) {
            const cptTemp = [];
            r.concepts.forEach( cpt => {
              if (cptTemp.indexOf(cpt) === -1) {
                cptTemp.push(cpt);
              }
            });
            r.concepts = cptTemp;
          }
          r.concepts = r.concepts && r.concepts.length > 0 ? r.concepts : [];
          if (r.children && r.children.length > 0) { // modules
            r.children.forEach(childM => {
              childM.concepts.forEach(c => {
                if (r.concepts.indexOf(c) === -1) {
                  r.concepts.push(c);
                }
              });
              if (childM.children && childM.children.length > 0) { // courses
                childM.children.forEach(childC => {
                  childC.concepts.forEach(c => {
                    if (r.concepts.indexOf(c) === -1) {
                      r.concepts.push(c);
                    }
                  });
                  if (childC.children && childC.children.length > 0) { // lectures
                    childC.children.forEach(childL => {
                      childL.concepts.forEach(c => {
                        if (r.concepts.indexOf(c) === -1) {
                          r.concepts.push(c);
                        }
                      });
                    });
                  }
                });
              }
            });
          }
          this.allResources.push(r);
          if (r.isPublic) {
            this.publicResources.push(r);
          }
        });
        spSubs.unsubscribe();
        this.sortedByName();
      });

    // get Occupational Profiles
    const opSubs = this.db
      .collection<Resource>(collectionOP)
      .valueChanges().subscribe(rs => {
        rs.forEach(r => {
          r.collection = collectionOP;
          r.collectionDisplay = collectionOPDisplay;
          r.concepts = r.knowledge;
          r.name = r.title;
          r.url = urlOPT + r._id;
          r.division = r.division ? r.division : '';
          r.type = 1;
          r.description = r.description.slice(0, 100) + '[...]'; // truncate description
          this.allResources.push(r);
          if (r.isPublic) {
            this.publicResources.push(r);
          }
        });
        opSubs.unsubscribe();
        this.sortedByName();
      });

    // get Other
    const otSubs = this.db
      .collection<Resource>(collectionOT)
      .valueChanges().subscribe(rs => {
        rs.forEach(r => {
          r.collection = collectionOT;
          r.collectionDisplay = collectionOT;
          r.concepts = r.concepts;
          r.name = r.title;
          r.url = r.url;
          r.division = r.division ? r.division : '';
          r.type = 3;
          r.description = r.description ?  r.description.slice(0, 100) + '[...]' : ''; // truncate description
          this.allResources.push(r);
          if (r.isPublic) {
            this.publicResources.push(r);
          }
        });
        otSubs.unsubscribe();
        this.sortedByName();
      });
  }

  getTrainingMaterials () {
    const tmSubs = this.db
      .collection<TrainingMaterial>(collectionTM)
      .valueChanges().subscribe(rs => {
        const urlGitHub = 'https://api.github.com/repos/eo4geocourses/metadata_scraper/contents/metadata_presentations.csv';
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const dateTM = rs[0] ? new Date(rs[0].updatedAt && rs[0].updatedAt.toDate()) : new Date();
        dateTM.setHours(0, 0, 0, 0);
        console.log('las dos fechas!!! ', dateTM, date);
        if (rs.length === 0 || (dateTM < date)) {
          rs.forEach( r => {
            if ( r.collection === collectionTM ) {
              console.log('Removing data from TrainingMaterials');
              this.db
                .collection(collectionTM)
                .doc(r._id)
                .delete();
            }
          });
          this.tmUpdated = false;
          this.http.get(urlGitHub)
            .subscribe(data => {
              const byteString = window.atob(data['content']);
              const arrayBuffer = new ArrayBuffer(byteString.length);
              const int8Array = new Uint8Array(arrayBuffer);
              for (let i = 0; i < byteString.length; i++) {
                int8Array[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([int8Array], {type: 'image/png'});
              const file = new File([blob], data['name'], {type: 'text/csv'});
              this.readFile(file);
            });
        }
          tmSubs.unsubscribe();
          this.sortedByName();
      });
  }

  readFile ( file ) {
    const fileReader = new FileReader();
    const dbIns = this.db;
    const tmFromGH = [];
    fileReader.onloadend = function(e) {
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      const list = fileReader.result ;
      const separator = '/' + '\n';
      const listString = list.toString().split(separator);

      for (let i = 1; i < listString.length - 1; i++) {
        // split to get the basic information
        const record = listString[i];
        const regValue = /(?!\s*$)\s*(?:'(\[^'\\]*(?:\\[\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,"\s\\]*(?:\s+[^,"\s\\]+)*))\s*(?:,|$)/g;
        const info = [];
        record.replace(regValue, ( v0, v1, v2, v3) => {
          if (v1 !== undefined) {
            info.push(v1.replace(/\\'/g, '\''));
          } else if (v2 !== undefined) {
            info.push(v2.replace(/\\"/g, '"'));
          } else if (v3 !== undefined) {
            info.push(v3);
          }
          return '';
        });
        if (/,\s*$/.test(record)) {
          info.push('');
        }
        const url = info[0];
        const hasMetadata = info[2];
        const title = info[3];
        const creators = [];
        const creatorsFromFile = info[4].replace('[', '').replace( ']', '').split(',');
        creatorsFromFile.forEach( con => {
          creators.push(con.replace(/['"]+/g, '').replace(/\s/g, ''));
        });
        const abstract = info[6];
        const description = info[7];
        const contributors = [];
        const contributorsFromFile = info[14].replace('[', '').replace( ']', '').split(',');
        contributorsFromFile.forEach( con => {
          contributors.push(con.replace(/['"]+/g, '').replace(/\s/g, ''));
        });
        const eqf = info[10].replace('EQF ', '');
        const concepts = [];
        const conceptsFromFile = info[16].replace('[', '').replace( ']', '').split(',');
        if ( info[16] !== '') {
          conceptsFromFile.forEach( con => {
            concepts.push(con.replace(/['"]+/g, '').replace(/\s/g, '').replace('eo4geo:', ''));
          });
        }
        const language = info[9];
        if ( hasMetadata === 'True') {
          const tm = new TrainingMaterial('', url , '' , '', '',
            'TrainingMaterials', 'TrainingMaterials' , true,  title,  title,
            description, abstract, contributors,  concepts, 4, eqf,  creators , timestamp, hasMetadata );
          const id = dbIns.createId();
          tm._id = id;
          if ( tm.url ) {
            tmFromGH.push(tm);
          }
        }
      }
    };
    setTimeout(() => {
      tmFromGH.forEach( tm => {
        if ( tm.url ) {
          const con = [];
          tm.concepts.forEach( c => {
            const cod = this.bokService.getConceptInfoByCode(c);
            con.push('[' + c + '] ' + cod.name);
          });
          tm.concepts = con;
          dbIns
            .collection(collectionTM)
            .doc(tm._id)
            .set(Object.assign({}, tm));
        }
      });
      this.getResources();
    }, 3000);
    fileReader.readAsText(file, 'UTF-8');
  }

  sortedByName () {
    this.publicResources.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ?  1 : -1);
  }
}
