import { Directive, OnInit, ElementRef } from '@angular/core';
import {MatchService} from '../../services/match.service';
import {UserService} from '../../services/user.service';
import {ActivatedRoute} from '@angular/router';
import {Match} from '../../model/resources.model';
import { Chart } from 'chart.js';

@Directive({
  selector: '[appChartNotCommon1]',

})
export class ChartNotCommon1Directive implements OnInit {

  selectedMatch: Match;
  myChart = null;
  statisticsNotMatching1 = [];
  kaCodes = {
    AM: 'Analytical Methods',
    CF: 'Conceptual Foundations',
    CV: 'Cartography and Visualization',
    DA: 'Design and Setup of Geographic Information Systems',
    DM: 'Data Modeling, Storage and Exploitation',
    GC: 'Geocomputation',
    GD: 'Geospatial Data',
    GS: 'GI and Society',
    IP: 'Image processing and analysis',
    OI: 'Organizational and Institutional Aspects',
    PP: 'Physical principles',
    PS: 'Platforms, sensors and digital imagery',
    TA: 'Thematic and application domains',
    WB: 'Web-based GI',
    GI: 'Geographic Information Science and Technology',
    SA: 'Satellite',
    SC: 'Satellite Communication',
    GN: 'GNSS'
  };
  constructor( private el: ElementRef, private matchService: MatchService,
               private userService: UserService,
               private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.getMatchId();
  }
  getMatchId(): void {
    const _id = this.route.snapshot.paramMap.get('name');
    this.matchService
      .getMatchById(_id)
      .subscribe(profile => {
        this.selectedMatch = profile;
        this.calculateNotmatchingStatistics();
      });
  }

  calculateNotmatchingStatistics() {
    this.statisticsNotMatching1 = [];
    if (this.selectedMatch.commonConcepts) {
      const tempStats2 = {};
      let tempTotal2 = 0;
      this.selectedMatch.notMatchConcepts1.forEach( nc => {
        const code = nc.code.slice(0, 2);
        tempStats2[code] !== undefined ? tempStats2[code]++ : tempStats2[code] = 1;
        tempTotal2++;
      });
      Object.keys(tempStats2).forEach(k => {
        const nameKA = k + ' - ' + this.kaCodes[k];
        this.statisticsNotMatching1.push({ code: nameKA, value: Math.round(tempStats2[k] * 100 / tempTotal2), count: tempStats2[k]  });
      });
    }
      this.graphStatistics(this.statisticsNotMatching1, this.el.nativeElement);
  }


  graphStatistics(statistics, chartId) {
    if (this.myChart !== null) {
      this.myChart.destroy();
    }
    const dataToGraph = [];
    const labelsToGraph = [];
    const colorsToGraph = [];
    statistics.forEach( st => {
      dataToGraph.push(st.count);
      labelsToGraph.push(st.code);
      colorsToGraph.push(this.getColor(st.code.slice(0, 2)));
    });
    this.myChart  = new Chart(chartId, {
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
      'bok-GI' : '#40e0d0',
      'bok-IP' : '#1f77b4',
      'bok-CF' : '#aec7e8',
      'bok-CV' : '#ff7f0e',
      'bok-DA' : '#ffbb78',
      'bok-DM' : '#2ca02c',
      'bok-DN' : '#98df8a',
      'bok-PS' : '#d62728',
      'bok-GD' : '#cc5b59',
      'bok-GS' : '#9467bd',
      'bok-AM' : '#8c564b',
      'bok-MD' : '#8c564b',
      'bok-OI' : '#c49c94',
      'bok-GC' : '#e377c2',
      'bok-PP' : '#f7b6d2',
      'bok-SD' : '#7f7f7f',
      'bok-SH' : '#c7c7c7',
      'bok-TA' : '#bcbd22',
      'bok-WB' : '#07561e',
      'bok-GN' : "#1ca8dd",
      'bok-SC' : "#ffcc00",
      'bok-SA' : "#ff9f4a",
      'bok-no' : '#17becf',
    };
    return colors['bok-' + code];
  }
}
