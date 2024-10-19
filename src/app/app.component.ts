import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import {
  EntityThread,
  RollForwardRelation,
  ThreadRelation,
} from "./interface/entity-thread";
import { TieringType } from "./enum/tiering-type";
import { GraphComponent } from "./components/graph/graph.component";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule, GraphComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = "tax-chart";
  graphForm:any;
  // Data example based on your input
  allEntityThreads: EntityThread[] = [
    { entity: "Entity 1", thread: "Thread 1", taxYear: 2022 },
    { entity: "Entity 1", thread: "Thread 2", taxYear: 2022 },
    { entity: "Entity 1", thread: "Thread 3", taxYear: 2023 },
    { entity: "Entity 2a", thread: "Thread 4", taxYear: 2022 },
    { entity: "Entity 2a", thread: "Thread 5", taxYear: 2023 },
    { entity: "Entity 2b", thread: "", taxYear: null },
    { entity: "Entity 2c", thread: "Thread 6", taxYear: 2022 },
    { entity: "Entity 2c", thread: "Thread 7", taxYear: 2022 },
    { entity: "Entity 2c", thread: "Thread 8", taxYear: 2023 },
    { entity: "Entity 3a1", thread: "Thread 9", taxYear: 2022 },
    { entity: "Entity 3a1", thread: "Thread 10", taxYear: 2023 },
    { entity: "Entity 3c1", thread: "Thread 11", taxYear: 2022 },
    { entity: "Entity 3c1", thread: "Thread 12", taxYear: 2023 },
    { entity: "Entity 3c2", thread: "Thread 13", taxYear: 2022 },
    { entity: "Entity 3c2", thread: "Thread 14", taxYear: 2022 },
    { entity: "Entity 3c2", thread: "Thread 15", taxYear: 2022 },
    { entity: "Entity 3c2", thread: "Thread 16", taxYear: 2023 },
    { entity: "Entity 3c2", thread: "Thread 17", taxYear: 2024 },
  ].filter((d) => d.taxYear !== null);

  allThreadRelations: ThreadRelation[] = [
    { lowerTier: "Thread 1", upperTier: "", tieringType: undefined },
    { lowerTier: "Thread 2", upperTier: "", tieringType: undefined },
    { lowerTier: "Thread 3", upperTier: "", tieringType: undefined },
    {
      lowerTier: "Thread 4",
      upperTier: "Thread 1",
      tieringType: TieringType.Real,
    },
    {
      lowerTier: "Thread 5",
      upperTier: "Thread 3",
      tieringType: TieringType.Real,
    },
    {
      lowerTier: "Thread 6",
      upperTier: "Thread 1",
      tieringType: TieringType.Real,
    },
    {
      lowerTier: "Thread 7",
      upperTier: "Thread 2",
      tieringType: TieringType.Hypothetical,
    },
    {
      lowerTier: "Thread 8",
      upperTier: "Thread 3",
      tieringType: TieringType.Real,
    },
    {
      lowerTier: "Thread 9",
      upperTier: "Thread 4",
      tieringType: TieringType.Real,
    },
    {
      lowerTier: "Thread 10",
      upperTier: "Thread 5",
      tieringType: TieringType.Real,
    },
    { lowerTier: "Thread 11", upperTier: "", tieringType: undefined },
    { lowerTier: "Thread 12", upperTier: "", tieringType: undefined },
    {
      lowerTier: "Thread 13",
      upperTier: "Thread 6",
      tieringType: TieringType.Real,
    },
    { lowerTier: "Thread 14", upperTier: "", tieringType: undefined },
    {
      lowerTier: "Thread 15",
      upperTier: "Thread 2",
      tieringType: TieringType.Hypothetical,
    },
    {
      lowerTier: "Thread 16",
      upperTier: "Thread 3",
      tieringType: TieringType.Real,
    },
    { lowerTier: "Thread 17", upperTier: "", tieringType: undefined },
  ];

  rollForwardRelations: RollForwardRelation[] = [
    { mainThread: "Thread 1", rollForward: "Thread 3", type: TieringType.Real },
    { mainThread: "Thread 2", rollForward: "", type: undefined },
    { mainThread: "Thread 3", rollForward: "", type: undefined },
    { mainThread: "Thread 4", rollForward: "Thread 5", type: TieringType.Real },
    { mainThread: "Thread 5", rollForward: "", type: undefined },
    { mainThread: "Thread 6", rollForward: "Thread 8", type: TieringType.Real },
    { mainThread: "Thread 7", rollForward: "", type: undefined },
    { mainThread: "Thread 8", rollForward: "", type: undefined },
    {
      mainThread: "Thread 9",
      rollForward: "Thread 10",
      type: TieringType.Real,
    },
    { mainThread: "Thread 10", rollForward: "", type: undefined },
    {
      mainThread: "Thread 11",
      rollForward: "Thread 12",
      type: TieringType.Hypothetical,
    },
    { mainThread: "Thread 12", rollForward: "" },
    {
      mainThread: "Thread 13",
      rollForward: "Thread 16",
      type: TieringType.Real,
    },
    { mainThread: "Thread 14", rollForward: "", type: undefined },
    { mainThread: "Thread 15", rollForward: "", type: undefined },
    {
      mainThread: "Thread 16",
      rollForward: "Thread 17",
      type: TieringType.Real,
    },
    { mainThread: "Thread 17", rollForward: "", type: undefined },
  ];
  uniqueYears = Array.from(
    new Set(this.allEntityThreads.map((thread) => thread.taxYear))
  );

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.graphForm = this.formBuilder.group({
      view: this.formBuilder.group({
        realTiering: [true],
        hypotheticalTiering: [true],
        realRoleForward: [true],
        hypotheticalRoleForward: [true],
      }),
      taxYears: this.formBuilder.array(
        this.uniqueYears.map(() => this.formBuilder.control(true))
      ),
    });
  }

  get threadRelations() {
    const realTiering = this.graphForm.get("view.realTiering")?.value;
    const hypotheticalTiering = this.graphForm.get(
      "view.hypotheticalTiering"
    )?.value;
    return this.allThreadRelations.filter((relation) => {
      if (relation.tieringType === TieringType.Real) {
        return realTiering
      }
      if (relation.tieringType === TieringType.Hypothetical) {
        return hypotheticalTiering;
      }
      return true;
    });
  }

  get entityThreads() {
    return this.allEntityThreads.filter((thread) => thread.entity);
  }

  get selectedYears() {
    return (this.graphForm.get("taxYears")?.value || [])
      .map((checked: boolean | null, index: number) =>
        checked ? this.uniqueYears[index] : null
      )
      .filter((year: number | null) => year !== null); // Get selected years
  }
}
