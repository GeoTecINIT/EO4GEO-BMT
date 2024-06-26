import { Directive, OnInit, ElementRef } from '@angular/core';
import {MatchService} from '../../services/match.service';
import {UserService} from '../../services/user.service';
import {ActivatedRoute} from '@angular/router';
import {Match} from '../../model/resources.model';
import { Chart } from 'chart.js';
import {BokService} from '../../services/bok.service';
import { DijkstraService } from '../../services/dijkstra.service';

@Directive({
  selector: '[appChartConcepts]',
  exportAs: 'appChartConcepts'
})
export class ChartConceptsDirective implements OnInit {

  selectedMatch: Match;
  myChart = null;
  statistics = [];
  multiParentsMatching = false;

  constructor( private el: ElementRef, private matchService: MatchService,
  private userService: UserService,
  private route: ActivatedRoute,
  private dijkstraService: DijkstraService) {
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
        this.calculateStatistics();
      });
  }

  calculateStatistics() {
    this.multiParentsMatching = false;
    if (this.selectedMatch) {
      const tempStats = {};
      let tempTotal = 0;
      this.selectedMatch.commonConcepts.forEach(kn => {
        let codes: Set<string> = this.dijkstraService.getParents(kn.code);
        if (codes.size > 1) this.multiParentsMatching = true;
        codes.forEach( code => {
          tempStats[code] !== undefined ? tempStats[code]++ : tempStats[code] = 1;
          tempTotal++;
        });
      });
      Object.keys(tempStats).forEach(k => {
        const nameKA = k + ' - ' + this.dijkstraService.getTreeNode(k).name;
        this.statistics.push({ code: nameKA, value: Math.round(tempStats[k] * 100 / tempTotal), count: tempStats[k] });
      });
      this.graphStatistics(this.statistics, this.el.nativeElement);
    }
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
      'bok-no' : '#17becf',
    };
    return colors['bok-' + code];
  }
}
