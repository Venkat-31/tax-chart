import { Component, Input, input, SimpleChanges, ViewEncapsulation } from "@angular/core";
import * as d3 from "d3";
import { EntityThread, ThreadRelation } from "../../interface/entity-thread";
import { TieringType } from "../../enum/tiering-type";
import { isNumberInRange } from "../../utils/common.utils";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-graph",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./graph.component.html",
  styleUrl: "./graph.component.scss",
  encapsulation: ViewEncapsulation.None,
})
export class GraphComponent {
  @Input() entityThreads: EntityThread[] = [];
  @Input() threadRelations: ThreadRelation[] = [];
  @Input() selectedYears: number[] = [];
  selectedEntities: Set<string> = new Set(this.uniqueEntityDomains);
  private svg: any;
  private margin = { top: 50, right: 50, bottom: 50, left: 100 };
  private width = 900 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;


  ngOnInit(): void {
    this.selectedEntities = new Set(this.uniqueEntityDomains);
  }

  ngAfterViewInit(): void {
    if (typeof document !== "undefined") {
      this.createSvg();
      this.drawTimeline();
    }
  }

  get entityDomains() {
    return this.entityThreads.map((thread) => thread.entity);
  }

  get uniqueEntityDomains() {
    return new Set(this.entityDomains);
  }

  get uniqueYears() {
    return Array.from(
      new Set(this.entityThreads.map((thread) => thread.taxYear))
    );
  }

  get blockWidth() {
    return this.width / this.uniqueYears.length;
  }

  // Create x-axis with custom ticks
  get xScale() {
    return d3
      .scaleBand<number>()
      .domain(this.uniqueYears)
      .range([0, this.width])
      .padding(0.1);
  }

  get yScale() {
    return d3
      .scaleBand<string>()
      .domain(this.entityDomains)
      .range([0, this.height])
      .padding(0.1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.svg) {
      this.drawTimeline();
    }
  }

  private createSvg(): void {
    this.svg = d3
      .select("figure#timeline")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
  }

  private cleanChart(): void {
    // Clear the existing chart
    this.svg.selectAll("*").remove();
  }

  private buildAxis(): void {
    // Draw gray background for the grid area
    this.svg
      .append("rect")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("fill", "lightgray");

    // Add axes
    this.svg
      .append("g")
      .call(d3.axisTop(this.xScale).tickFormat(d3.format("d")));

    // // Create the y-axis and get the ticks
    // const yAxis = d3.axisLeft(this.yScale);
    // this.svg.append("g").call(yAxis); // Draw the y-axis

    // // Get the domain (the entity names) for custom ticks
    // const yTicks = this.yScale.domain();

    // // Draw custom ticks before y-axis ticks
    // this.svg
    //   .selectAll(".custom-tick")
    //   .data(yTicks)
    //   .enter()
    //   .append("line")
    //   .attr("class", "custom-tick")
    //   .attr("x1", -10) // Length of the custom tick
    //   .attr("x2", 0) // End point of the custom tick
    //   .attr("y1", (d: string) => (this.yScale(d) as number) + this.yScale.bandwidth() / 2) // Center vertically
    //   .attr("y2", (d: string) => (this.yScale(d) as number) + this.yScale.bandwidth() / 2) // Center vertically
    //   .attr("stroke", "black")
    //   .attr("stroke-width", 1);
    
    // // X-axis with ticks
    // this.svg
    //   .append("g")
    //   .attr("transform", `translate(0, 0)`)
    //   .call(d3.axisTop(this.xScale).tickFormat(d3.format("d")));

    // // Draw grid lines for x-axis
    // this.svg
    //   .append("g")
    //   .attr("class", "x-grid")
    //   .selectAll("line")
    //   .data(this.uniqueYears)
    //   .enter()
    //   .append("line")
    //   .attr("x1", (d: number) => (this.xScale(d) as number) + this.xScale.bandwidth() / 2)
    //   .attr("x2", (d: number) => (this.xScale(d) as number) + this.xScale.bandwidth() / 2)
    //   .attr("y1", 0)
    //   .attr("y2", this.height)
    //   .attr("stroke", "#a3a3a3")
    //   .attr("stroke-opacity", 0.7);

    this.svg.append("g").attr("class", "custom-tick").call(d3.axisLeft(this.yScale));
    this.svg
      .append("g")
      .attr("class", "x-grid")
      .selectAll("line")
      .data(this.uniqueYears)
      .enter()
      .append("line")
      .attr("x1", (d: number) => (this.xScale(d) as number) + this.xScale.bandwidth() / 2)
      .attr("x2", (d: number) => (this.xScale(d) as number) + this.xScale.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", this.height)
      .attr("stroke", "#a3a3a3")
      .attr("stroke-opacity", 0.7);

    this.svg
      .append("g")
      .attr("class", "y-grid")
      .selectAll("line")
      .data(this.entityDomains)
      .enter()
      .append("line")
      .attr("y1", (d: string) => (this.yScale(d) as number) + this.yScale.bandwidth() / 2)
      .attr("y2",(d: string) => (this.yScale(d) as number) + this.yScale.bandwidth() / 2)
      .attr("x1", 0)
      .attr("x2", this.width)
      .attr("stroke", "#7791a3")
      .attr("stroke-opacity", 0.7);
  }

  private drawTimeline(): void {
    this.cleanChart();
    this.buildAxis();
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
        const baseX =
          (this.xScale(year) as number) + this.xScale.bandwidth() / 2; // Center the circle in the year
        const y = (this.yScale(entity) as number) + this.yScale.bandwidth() / 2; // Center the circle in the entity
        const spaceBetweenCircles = this.blockWidth / threads.length;

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
            .append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 5)
            .style("fill", "white");

          // Add text label for the thread
          this.svg
            .append("text")
            .attr("style", "font-size: 10px;")
            .attr("x", x + 10) // Offset text slightly from the circle
            .attr("y", y)
            .attr("alignment-baseline", "middle")
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
      if (!this.selectedYears.includes(lowerThread.taxYear)) {
        return;
      }
      if (!this.selectedEntities.has(lowerThread.entity)) {
        return;
      }

      const lineColor =
        relation.tieringType === TieringType.Real ? "red" : "yellow";
      let x1 = threadPositions[lowerThread.thread].x;
      const y1 =
        (this.yScale(lowerThread.entity) as number) +
        this.yScale.bandwidth() / 2;
      let x2 = threadPositions[upperThread.thread].x;
      const y2 =
        (this.yScale(upperThread.entity) as number) +
        this.yScale.bandwidth() / 2;

      const threadCrossThread = Object.values(threadPositions).some(
        (point) => point.x === x1 && isNumberInRange(point.y, y2 + 1, y1 - 1)
      );
      const pointIndex = xOffsetPoint.findIndex((point) => point.x === x1);
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
        if (!xOffsetPoint[pointIndex]?.crossThread) {
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
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 10) // Position of the arrowhead
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("polygon")
        .attr("points", "0,0 10,5 0,10")
        .attr("fill", lineColor);
      this.svg
        .append("path")
        .datum(lineData)
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 0.75)
        .attr("marker-end", "url(#arrow)");
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
    //   const y1 = (this.yScale(mainThread.entity) as number) + this.yScale.bandwidth() / 2;
    //   const x2 = threadOffset[forwardThread.thread];
    //   const y2 =
    //     (this.yScale(forwardThread.entity) as number) + this.yScale.bandwidth() / 2;
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
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 Z")
      .attr("fill", "black");
  }

  isEntitySelected(entity: string): boolean {
    return this.selectedEntities.has(entity);
  }

  toggleEntity(entity: string): void {
    if (this.selectedEntities.has(entity)) {
      this.selectedEntities.delete(entity);
    } else {
      this.selectedEntities.add(entity);
    }
    this.drawTimeline();
  }

  getCheckboxY(entity: string): number {
    // Get the y position using yScale for the entity
    return (this.yScale(entity) as number) + this.yScale.bandwidth() / 2;
  }
}
