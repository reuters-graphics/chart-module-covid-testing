import * as d3 from 'd3';

import ChartComponent from './base/ChartComponent';

class TestingChart extends ChartComponent {
  defaultProps = {
    height: 400,
    margin: {
      left: 50,
      right: 50,
      top: 10,
      bottom: 30,
    },
    range: {
      startDate: '2020-03-01',
    },
    formatters: {
      caseTime: '%Y-%m-%d',
      date: '%B',
    },
    fills: {
      tests: '#eec331',
      refbox: 'rgba(255,255,255,.1)',
      label: 'rgba(255,255,255,.9)',
    },

    avg_days: 7,
    refBox: { y1: 0, y2: 5 },
    refLabel: {
      text: 'W.H.O. recommendation',
    },
    lineThickness: 2,
  };

  draw() {
    const data = this.data();
    const props = this.props();
    const node = this.selection().node();
    const { width } = node.getBoundingClientRect();
    const caseParse = d3.timeParse(props.formatters.caseTime);
    const dateFormat = d3.timeFormat(props.formatters.date);

    const transition = d3.transition()
      .duration(750);

    const svg = this.selection()
      .appendSelect('svg') // see docs in ./utils/d3.js
      .attr('width', width)
      .attr('height', props.height);

    const g = svg.appendSelect('g.container')
      .attr('transform', `translate(${props.margin.left}, ${props.margin.top})`);

    data.cases = data.cases.sort((a, b) => (d3.descending(caseParse(a.date), caseParse(b.date))));
    data.tests = data.tests.sort((a, b) => (d3.descending(caseParse(a.date), caseParse(b.date))));

    for (let i = 0; i < data.cases.length; i++) {
      data.cases[i].parsedDate = caseParse(data.cases[i].date);
      data.cases[i].mean = d3.mean(data.cases.slice(i, (i + props.avg_days)), d => +d.count < 0 ? 0 : d.count); // avg calc
    }

    for (let i = 0; i < data.tests.length; i++) {
      data.tests[i].parsedDate = caseParse(data.tests[i].date);
      data.tests[i].mean = d3.mean(data.tests.slice(i, (i + props.avg_days)), d => +d.count < 0 ? 0 : d.count); // avg calc
    }

    for (let i = 0; i < data.tests.length; i++) {
      const caseNum = data.cases.filter(d => d.date === data.tests[i].date)[0];
      if (caseNum) {
        data.tests[i].caseMean = caseNum.mean;
        data.tests[i].posRate = data.tests[i].caseMean / data.tests[i].mean * 100;
      }
    }

    const parsedStartDate = caseParse(props.range.startDate);

    data.tests = data.tests.filter(d => d.posRate && d.parsedDate >= parsedStartDate);

    // Little trick so that I can pass this parsed/calced data outside the chart
    // to things like smarttext.
    this.testingData = data.tests;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data.tests, d => d.parsedDate))
      .range([0, width - props.margin.right - props.margin.left]);

    let maxY = d3.max(data.tests, d => d.posRate);
    maxY = maxY < 8 ? 8 : maxY;
    const yScale = d3.scaleLinear()
      .domain([0, maxY])
      .range([props.height - props.margin.top - props.margin.bottom, 0]);

    const maxCases = d3.max(data.cases, d => d.mean);
    const maxTests = d3.max(data.tests, d => d.mean);

    const lineTests = d3.line()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.posRate));

    g.appendSelect('g.axis.axis--x')
      .attr('transform', `translate(0,${props.height - props.margin.top - props.margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(dateFormat));

    g.appendSelect('g.axis.axis--y.axis--y1')
      .attr('transform', `translate(${width - props.margin.left - props.margin.right},0)`)
      .call(d3.axisRight(yScale).ticks(5).tickFormat((d, i) => i == 4 ? `${d}%` : d));

    g.appendSelect('line.base-line')
      .attr('x1', 0)
      .attr('x2', width - props.margin.left - props.margin.right)
      .attr('y1', yScale(0) + 0.5)
      .attr('y2', yScale(0) + 0.5);

    g.appendSelect('rect.refBox')
      .style('fill', props.fills.refbox)
      .attr('x', 0)
      .attr('width', width - props.margin.left - props.margin.right)
      .attr('y', yScale(props.refBox.y2))
      .attr('height', yScale(props.refBox.y1) - yScale(props.refBox.y2));

    g.appendSelect('path.test-area')
      .style('fill', 'none')
      .style('stroke', props.fills.tests)
      .style('stroke-width', props.lineThickness)
      .attr('d', lineTests(data.tests));

    const labelG = g.appendSelect('g.ref-label')
      .appendSelect('text')
      .style('fill', props.fills.label)
      .text(props.refLabel.text);

    if (data.tests[0].posRate >= 2) {
      labelG.attr('transform', `translate(${(width - props.margin.left - props.margin.right) - 20},${(props.height - props.margin.top - props.margin.bottom) * 0.93})`)
        .style('text-anchor', 'end');
    } else {
      labelG.attr('transform', `translate(${(width - props.margin.left - props.margin.right) - 20},${(props.height - props.margin.top - props.margin.bottom) * 0.5})`)
        .style('text-anchor', 'end');
    }
    return this;
  }
}

export default TestingChart;
