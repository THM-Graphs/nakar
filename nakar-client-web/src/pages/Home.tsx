import { Container, Image } from "react-bootstrap";

export function Home() {
  return (
    <Container className={"text-center mt-5"} style={{ width: "800px" }}>
      <Image
        src={"/logo.png"}
        style={{ width: "200px" }}
        className={"mb-2"}
        rounded
        fluid
      ></Image>
      <h1 className={"mb-4"}>NAKAR</h1>
      <blockquote className={"mb-4 blockquote"}>
        Navigation und Erschließung von Knowledge-Graphen in Augmented Reality -
        Nutzerzentrierte serendipitäre Entdeckungen
      </blockquote>
      <p className={"text-justify"}>
        Das Projekt ”NAKAR - Navigation und Erschließung von Knowledge-Graphen
        in Augmented Reality“ zielt darauf ab, mit dem Einsatz von Augmented
        Reality (AR) nutzerzentrierte, serendipitäre Entdeckungen in
        Knowledge-Graphen zu ermöglichen. Es soll ein niederschwelliger Zugang
        in komplexe Datenstrukturen geschaffen werden, der auch
        nicht-technischen Nutzern eine effektive Nutzung ermöglicht.
      </p>
    </Container>
  );
}
