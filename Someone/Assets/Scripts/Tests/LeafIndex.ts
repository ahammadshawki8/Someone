/**
 * LeafIndex - registers all Someone LEAF test scenarios.
 */
import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {DoneCriterion1Scenario} from "./DoneCriterion1Scenario"
import {DoneCriterion2Scenario} from "./DoneCriterion2Scenario"
import {DoneCriterion3Scenario} from "./DoneCriterion3Scenario"
import {DoneCriterion4Scenario} from "./DoneCriterion4Scenario"
import {DoneCriterion5Scenario} from "./DoneCriterion5Scenario"
import {DemoRunScenario} from "./DemoRunScenario"
import {FlowRulesScenario} from "./FlowRulesScenario"
import {HandCompressionScenario} from "./HandCompressionScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {
      id: "done-criterion-1-scenario",
      typename: DoneCriterion1Scenario.getTypeName(),
    },
    {
      id: "done-criterion-2-scenario",
      typename: DoneCriterion2Scenario.getTypeName(),
    },
    {
      id: "done-criterion-3-scenario",
      typename: DoneCriterion3Scenario.getTypeName(),
    },
    {
      id: "done-criterion-4-scenario",
      typename: DoneCriterion4Scenario.getTypeName(),
    },
    {
      id: "done-criterion-5-scenario",
      typename: DoneCriterion5Scenario.getTypeName(),
    },
    {
      id: "hand-compression-scenario",
      typename: HandCompressionScenario.getTypeName(),
    },
    {
      id: "flow-rules-scenario",
      typename: FlowRulesScenario.getTypeName(),
    },
    {
      id: "demo-run-scenario",
      typename: DemoRunScenario.getTypeName(),
    },
  ]
}
