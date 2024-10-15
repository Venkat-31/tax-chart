import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as d3 from 'd3';

enum TieringType {
  Real = 'Real',
  Hypothetical = 'Hypothetical',
}

interface EntityThread {
  entity: string;
  thread: string;
  taxYear: number;
}

interface ThreadRelation {
  lowerTier: string;
  upperTier: string;
  tieringType?: TieringType;
}

interface RollForwardRelation {
  mainThread: string;
  rollForward: string;
  type?: TieringType;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'tax-chart';
  // Data example based on your input
  entityThreads: EntityThread[] = [
    { entity: 'Entity 1', thread: 'Thread 1', taxYear: 2022 },
    { entity: 'Entity 1', thread: 'Thread 2', taxYear: 2022 },
    { entity: 'Entity 1', thread: 'Thread 3', taxYear: 2023 },
    { entity: 'Entity 2a', thread: 'Thread 4', taxYear: 2022 },
    { entity: 'Entity 2a', thread: 'Thread 5', taxYear: 2023 },
    { entity: 'Entity 2b', thread: '', taxYear: null },
    { entity: 'Entity 2c', thread: 'Thread 6', taxYear: 2022 },
    { entity: 'Entity 2c', thread: 'Thread 7', taxYear: 2022 },
    { entity: 'Entity 2c', thread: 'Thread 8', taxYear: 2023 },
    { entity: 'Entity 3a1', thread: 'Thread 9', taxYear: 2022 },
    { entity: 'Entity 3a1', thread: 'Thread 10', taxYear: 2023 },
    { entity: 'Entity 3c1', thread: 'Thread 11', taxYear: 2022 },
    { entity: 'Entity 3c1', thread: 'Thread 12', taxYear: 2023 },
    { entity: 'Entity 3c2', thread: 'Thread 13', taxYear: 2022 },
    { entity: 'Entity 3c2', thread: 'Thread 14', taxYear: 2022 },
    { entity: 'Entity 3c2', thread: 'Thread 15', taxYear: 2022 },
    { entity: 'Entity 3c2', thread: 'Thread 16', taxYear: 2023 },
    { entity: 'Entity 3c2', thread: 'Thread 17', taxYear: 2024 },
  ].filter((d) => d.taxYear !== null);

  threadRelations: ThreadRelation[] = [
    { lowerTier: 'Thread 1', upperTier: '', tieringType: undefined },
    { lowerTier: 'Thread 2', upperTier: '', tieringType: undefined },
    { lowerTier: 'Thread 3', upperTier: '', tieringType: undefined },
    {
      lowerTier: 'Thread 4',
      upperTier: 'Thread 1',
      tieringType: TieringType.Real,
    },
    {
      lowerTier: 'Thread 5',
      upperTier: 'Thread 3',
      tieringType: TieringType.Real,
    },
    {
      lowerTier: 'Thread 6',
      upperTier: 'Thread 1',
      tieringType: TieringType.Real,
    },
    {
      lowerTier: 'Thread 7',
      upperTier: 'Thread 2',
      tieringType: TieringType.Hypothetical,
    },
    {
      lowerTier: 'Thread 8',
      upperTier: 'Thread 3',
      tieringType: TieringType.Real,
    },
    {
      lowerTier: 'Thread 9',
      upperTier: 'Thread 4',
      tieringType: TieringType.Real,
    },
    {
      lowerTier: 'Thread 10',
      upperTier: 'Thread 5',
      tieringType: TieringType.Real,
    },
    { lowerTier: 'Thread 11', upperTier: '', tieringType: undefined },
    { lowerTier: 'Thread 12', upperTier: '', tieringType: undefined },
    {
      lowerTier: 'Thread 13',
      upperTier: 'Thread 6',
      tieringType: TieringType.Real,
    },
    { lowerTier: 'Thread 14', upperTier: '', tieringType: undefined },
    {
      lowerTier: 'Thread 15',
      upperTier: 'Thread 2',
      tieringType: TieringType.Hypothetical,
    },
    {
      lowerTier: 'Thread 16',
      upperTier: 'Thread 3',
      tieringType: TieringType.Real,
    },
    { lowerTier: 'Thread 17', upperTier: '', tieringType: undefined },
  ];

  rollForwardRelations: RollForwardRelation[] = [
    { mainThread: 'Thread 1', rollForward: 'Thread 3', type: TieringType.Real },
    { mainThread: 'Thread 2', rollForward: '', type: undefined },
    { mainThread: 'Thread 3', rollForward: '', type: undefined },
    { mainThread: 'Thread 4', rollForward: 'Thread 5', type: TieringType.Real },
    { mainThread: 'Thread 5', rollForward: '', type: undefined },
    { mainThread: 'Thread 6', rollForward: 'Thread 8', type: TieringType.Real },
    { mainThread: 'Thread 7', rollForward: '', type: undefined },
    { mainThread: 'Thread 8', rollForward: '', type: undefined },
    {
      mainThread: 'Thread 9',
      rollForward: 'Thread 10',
      type: TieringType.Real,
    },
    { mainThread: 'Thread 10', rollForward: '', type: undefined },
    {
      mainThread: 'Thread 11',
      rollForward: 'Thread 12',
      type: TieringType.Hypothetical,
    },
    { mainThread: 'Thread 12', rollForward: '' },
    {
      mainThread: 'Thread 13',
      rollForward: 'Thread 16',
      type: TieringType.Real,
    },
    { mainThread: 'Thread 14', rollForward: '', type: undefined },
    { mainThread: 'Thread 15', rollForward: '', type: undefined },
    {
      mainThread: 'Thread 16',
      rollForward: 'Thread 17',
      type: TieringType.Real,
    },
    { mainThread: 'Thread 17', rollForward: '', type: undefined },
  ];

  private svg: any;
  private margin = { top: 50, right: 50, bottom: 50, left: 100 };
  private width = 900 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;

  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') {
      this.createSvg();
      this.drawTimeline();
    }
  }

  private createSvg(): void {
    this.svg = d3
      .select('figure#timeline')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }
  private drawTimeline(): void {
    const entityDomains = this.entityThreads.map((thread) => thread.entity);
    const uniqueYears = Array.from(
      new Set(this.entityThreads.map((thread) => thread.taxYear))
    );
    const blockWidth = this.width / uniqueYears.length;

    // Create x-axis with custom ticks
    const xScale = d3
      .scaleBand<number>()
      .domain(uniqueYears)
      .range([0, this.width])
      .padding(0.1);

    const yScale = d3
      .scaleBand<string>()
      .domain(entityDomains)
      .range([0, this.height])
      .padding(0.1);

    // Draw gray background for the grid area
    this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'lightgray'); // Set the background color
    // Add axes
    this.svg.append('g').call(d3.axisTop(xScale).tickFormat(d3.format('d')));
    this.svg.append('g').call(d3.axisLeft(yScale));

    this.svg
      .append('g')
      .attr('class', 'x-grid')
      .selectAll('line')
      .data(uniqueYears)
      .enter()
      .append('line')
      .attr('x1', (d: number) => (xScale(d) as number) + xScale.bandwidth() / 2)
      .attr('x2', (d: number) => (xScale(d) as number) + xScale.bandwidth() / 2)
      .attr('y1', 0)
      .attr('y2', this.height)
      .attr('stroke', '#e8e8e8')
      .attr('stroke-opacity', 0.7);

    this.svg
      .append('g')
      .attr('class', 'y-grid')
      .selectAll('line')
      .data(entityDomains)
      .enter()
      .append('line')
      .attr('y1', (d: string) => (yScale(d) as number) + yScale.bandwidth() / 2)
      .attr('y2', (d: string) => (yScale(d) as number) + yScale.bandwidth() / 2)
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('stroke', 'lightgray')
      .attr('stroke-opacity', 0.7);

    // Group threads by taxYear and entity
    const groupedData = d3.groups(
      this.entityThreads,
      (d) => d.taxYear,
      (d) => d.entity
    );
    const threadOffset: Record<string, number> = {};
    const threadPositions: Record<string, { x: number; y: number }> = {};
    let xOffsetPoint: { x: number; crossThread: number }[] = [];
    let yOffsetPoint: { y: number; crossThread: number }[] = [];

    // Draw circles with slight offsets for overlapping threads
    groupedData.forEach(([year, entities]) => {
      const entityOffsetX: Record<string, number> = {};
      entities.forEach(([entity, threads]) => {
        const baseX = (xScale(year) as number) + xScale.bandwidth() / 2; // Center the circle in the year
        const y = (yScale(entity) as number) + yScale.bandwidth() / 2; // Center the circle in the entity
        const spaceBetweenCircles = blockWidth / threads.length;

        threads.forEach((thread) => {
          // Calculate y position with entityOffsetX
          const x = entityOffsetX[entity]
            ? baseX + entityOffsetX[entity] * spaceBetweenCircles
            : baseX; // Increment y position for overlap
          entityOffsetX[entity] = (entityOffsetX[entity] || 0) + 1; // Update the entityOffsetX for this entity
          threadOffset[thread.thread] = x;
          threadPositions[thread.thread] = { x, y };
          // Draw the circle
          this.svg
            .append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 5)
            .style('fill', 'white');

          // Add text label for the thread
          this.svg
            .append('text')
            .attr('style', 'font-size: 10px;')
            .attr('x', x + 10) // Offset text slightly from the circle
            .attr('y', y)
            .attr('alignment-baseline', 'middle')
            .text(thread.thread);
        });
      });
    });

    const lineGenerator = d3
      .line()
      .curve(d3.curveCardinal.tension(0.5))
      .x((d: any) => d.x) // Access the x-coordinate of each point
      .y((d: any) => d.y); // Access the y-coordinate of each point

    // Draw tier relations between threads (lines and arrows)
    this.threadRelations.forEach((relation) => {
      if (!relation.upperTier) {
        return;
      }
      const lowerThread = this.entityThreads.find(
        (t) => t.thread === relation.lowerTier
      ) as EntityThread;
      const upperThread = this.entityThreads.find(
        (t) => t.thread === relation.upperTier
      ) as EntityThread;

      if (!lowerThread || !upperThread) {
        return;
      }

      const lineColor =
        relation.tieringType === TieringType.Real ? 'red' : 'yellow';
      let x1 = threadPositions[lowerThread.thread].x;
      const y1 =
        (yScale(lowerThread.entity) as number) + yScale.bandwidth() / 2;
      let x2 = threadPositions[upperThread.thread].x;
      const y2 =
        (yScale(upperThread.entity) as number) + yScale.bandwidth() / 2;

      console.log("t",lowerThread.thread, y1, y2);
      console.log("threadPositions",threadPositions);
      
      const threadCrossThread = Object.values(threadPositions).some((point) => point.x === x1 && isNumberInRange(point.y, y2 + 1, y1 - 1)); 
      const pointIndex = xOffsetPoint.findIndex((point) => point.x === x1);
      console.log("xOffsetPoint",xOffsetPoint, pointIndex);
      
      console.log("threadCrossThread",threadCrossThread);
      let lineData: { x: number; y: number }[] = [];

      if (threadCrossThread) {
        lineData = [
          { x: x1 + 5, y: y1 },
          { x: x1 + 15, y: y1 - 10 }, // Control point for the curve
          { x: x1 + 18, y: y1 - 50 },
          { x: x2 + 15, y: y2 + 10 }, // Control point for the curve
          { x: x2 + 5, y: y2 },
        ];
        const crossThread = xOffsetPoint[pointIndex]?.crossThread || 1;
        lineData[1].x += crossThread * 10;
        lineData[2].x += crossThread * 10;
        lineData[3].x += crossThread * 10;
        if(!xOffsetPoint[pointIndex]?.crossThread) {
          xOffsetPoint.push({
            x: x1,
            crossThread: 2,
          });
        } else {
          xOffsetPoint[pointIndex].crossThread += 1;
        }
      } else {
        lineData = [
          { x: x1, y: y1 - 5 },
          { x: x2, y: y2 + 5 },
        ];
        xOffsetPoint.push({
          x: x1,
          crossThread: 1,
        });
      }

      this.svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 10) // Position of the arrowhead
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0,0 10,5 0,10')
        .attr('fill', lineColor);
      this.svg
        .append('path')
        .datum(lineData)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 0.75)
        .attr('marker-end', 'url(#arrow)');
    });

    // this.rollForwardRelations.forEach((relation) => {
    //   if (!relation.rollForward) {
    //     return;
    //   }
    //   const mainThread = this.entityThreads.find(
    //     (t) => t.thread === relation.mainThread
    //   ) as EntityThread;
    //   const forwardThread = this.entityThreads.find(
    //     (t) => t.thread === relation.rollForward
    //   ) as EntityThread;

    //   if (!mainThread || !forwardThread) {
    //     return;
    //   }

    //   const lineColor =
    //     relation.type === TieringType.Real ? '#283379' : '#4cbaeb';
    //   const x1 = threadOffset[mainThread.thread];
    //   const y1 = (yScale(mainThread.entity) as number) + yScale.bandwidth() / 2;
    //   const x2 = threadOffset[forwardThread.thread];
    //   const y2 =
    //     (yScale(forwardThread.entity) as number) + yScale.bandwidth() / 2;
    //   console.log("mainThread",mainThread);
      
    //   const pointIndex = yOffsetPoint.findIndex((point) => point.y === y1);
    //   console.log("threadPositions",threadPositions);
    //   const threadCrossThread = Object.values(threadPositions).some((point) => point.y === y1 && isNumberInRange(point.x, x1 + 1, x2 - 1)); 
    //   console.log("threadCrossThread ",threadCrossThread, yOffsetPoint, pointIndex);
    //   let lineData: { x: number; y: number }[] = [];

    //   if (threadCrossThread) {
    //     lineData = [
    //       { x: x1, y: y1 + 5 },
    //       { x: x1 + 20, y: y1 + 15 }, // Control point for the curve
    //       { x: x1 + 50, y: y1 + 15 },
    //       { x: x2 - 20, y: y2 + 15 }, // Control point for the curve
    //       { x: x2, y: y2 + 5 },
    //     ];
    //     const currentCrossThread = (yOffsetPoint[pointIndex]?.crossThread || 1);
    //     lineData[1].y += currentCrossThread * 10;
    //     lineData[2].y += currentCrossThread * 10;
    //     lineData[3].y += currentCrossThread * 10;
    //     if (!yOffsetPoint[pointIndex]?.crossThread) {
    //       yOffsetPoint.push({
    //         y: y1,
    //         crossThread: 2,
    //       });
    //     } else {
    //       yOffsetPoint[pointIndex].crossThread += 1;
    //     }
    //     // yOffsetPoint[pointIndex].crossThread += 1;
    //   } else {
    //     lineData = [
    //       { x: x1 + 5, y: y1 },
    //       { x: x2 - 5, y: y2 },
    //     ];
    //     yOffsetPoint.push({
    //       y: y1,
    //       crossThread: 0,
    //     });
    //   }

    //   this.svg
    //     .append('defs')
    //     .append('marker')
    //     .attr('id', 'arrow')
    //     .attr('viewBox', '0 0 10 10')
    //     .attr('refX', 10) // Position of the arrowhead
    //     .attr('refY', 5)
    //     .attr('markerWidth', 6)
    //     .attr('markerHeight', 6)
    //     .attr('orient', 'auto')
    //     .append('polygon')
    //     .attr('points', '0,0 10,5 0,10')
    //     .attr('fill', lineColor);
    //   this.svg
    //     .append('path')
    //     .datum(lineData)
    //     .attr('d', lineGenerator)
    //     .attr('fill', 'none')
    //     .attr('stroke', lineColor)
    //     .attr('stroke-width', 0.75)
    //     .attr('marker-end', 'url(#arrow)');
    // });

    // Define an arrow marker for the end of the line
    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 5)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
      .attr('fill', 'black');
  }
}

function isNumberInRange(number: number, min: number, max: number) {
  console.log("number",number,"min",min,"max",max);
  
  return number >= min && number <= max;
}
