import React, { Component } from 'react';
import ReactLoading from "react-loading";
import { Fireworks } from 'fireworks/lib/react'

import "./Sudoku.css"
import Header from '../components/Header';
import Grid9x9 from '../components/Grid_9x9';
import ScreenInputKeyBoard from '../components/ScreenInputKeyBoard'
import { problemList } from "../problems"

class Sudoku extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true, // Return loading effect if this is true.
            problem: null, // Stores problem data. See "../problems/" for more information.This is the origin problem and should not be modified. This is used to distinguish the fixed numbers from the editable values
            gridValues: null,  // A 2D array storing the current values on the gameboard. You should update this when updating the game board values.
            selectedGrid: { row_index: -1, col_index: -1 }, // This objecct store the current selected grid position. Update this when a new grid is selected.
            gameBoardBorderStyle: "8px solid #000", // This stores the gameBoarderStyle and is passed to the gameboard div. Update this to have a error effect (Bonus #2).
            completeFlag: false, // Set this flag to true when you wnat to set off the firework effect.
            conflicts: [], // The array stores all the conflicts positions triggered at this moment. Update the array whenever you needed.
            currentTimeout: -1,
        }
    }

    handle_grid_1x1_click = (row_index, col_index) => {
        if (this.state.problem.content[row_index][col_index] === "0") {
            this.setState({
                selectedGrid: {
                    row_index: row_index,
                    col_index: col_index,
                },
            });
        }
    }
    checkWin = () => {
        let count = 0;
        for (let i = 0; i < 9; i += 1) {
            for (let j = 0; j < 9; j += 1) {
                if (this.state.gridValues[i][j] !== "0") count += 1;
            }
        }
        if (count === 81) {
            this.setState({completeFlag: true});
            setTimeout(() => { this.setState({ completeFlag: false }); }, 2500);
        }
    };
    handleInput = (row, col, num) => {
        if (this.state.problem.content[row][col] !== "0") return;
        const conflictArr = [];
        for (let i = 0; i < 9; i += 1) {
            for (let j = 0; j < 9; j += 1) {
                if (i === row && j === col) continue;
                if (i !== row && j !== col && (Math.floor(row / 3) !== Math.floor(i / 3) || Math.floor(col / 3) !== Math.floor(j / 3))) continue;
                if (this.state.gridValues[i][j] !== "0" && num !== "0" && num === this.state.gridValues[i][j]) {
                    conflictArr.push({
                        row_index: i,
                        col_index: j,
                    })
                }
            }
        }
        this.setState((state) => ({
            conflicts: conflictArr
        }));
        if (conflictArr.length > 0) {
            if (this.state.currentTimeout !== -1) {
                clearTimeout(this.state.currentTimeout);
            }
            let timeoutId = setTimeout(() => {
                this.setState({
                    conflicts: [],
                    gameBoardBorderStyle: "8px solid #000",
                    currentTimeout: -1,
                });
            }, 1000);
            this.setState({ 
                gameBoardBorderStyle: "8px solid #E77",
                currentTimeout: timeoutId,
            });
            return;
        }
        this.setState((state) => {
            const newValue = [...state.gridValues];
            const newRow = [...state.gridValues[state.selectedGrid.row_index]];
            newRow[this.state.selectedGrid.col_index] = num;
            newValue[state.selectedGrid.row_index] = newRow;
            return { gridValues: newValue };
        });
        this.checkWin();
    }

    handleKeyDownEvent = (event) => {
        if (this.loading === true || this.state.selectedGrid.row_index === -1 || !isFinite(event.key)) return;
        this.handleInput(this.state.selectedGrid.row_index, this.state.selectedGrid.col_index, event.key);
    }

    handleScreenKeyboardInput = (num) => {
        if (this.loading === true || this.state.selectedGrid.row_index === -1) return;
        this.handleInput(this.state.selectedGrid.row_index, this.state.selectedGrid.col_index, num);
    }

    componentDidMount = () => {
        window.addEventListener('keydown', this.handleKeyDownEvent);
    }

    loadProblem = async (name) => {
        this.setState({
            loading: true,
            problem: null,
            gridValues: null,
            selectedGrid: { row_index: -1, col_index: -1 }
        });

        const problem = await require(`../problems/${name}`)
        if (problem.content !== undefined) {
            let gridValues = [];
            for (let i = 0; i < problem.content.length; i++)
                gridValues[i] = problem.content[i].slice();
            this.setState({ problem: problem, gridValues: gridValues, loading: false });
        }
    }

    extractArray(array, col_index, row_index) {
        let rt = []
        for (let i = row_index; i < row_index + 3; i++) {
            for (let j = col_index; j < col_index + 3; j++) {
                rt.push(array[i][j])
            }
        }
        return rt;
    }
    resetGame = () => {
        if (this.state.loading === false) {
            let gridValues = [];
            for (let i = 0; i < this.state.problem.content.length; i++)
                gridValues[i] = this.state.problem.content[i].slice();
            this.setState({
                gridValues: gridValues,
                selectedGrid: { row_index: -1, col_index: -1 },
                conflicts: [],
                completeFlag: false,
                gameBoardBorderStyle: "8px solid #000",
            });
        }
    };
    render() {
        const fxProps = {
            count: 3,
            interval: 700,
            canvasWidth: window.innerWidth,
            canvasHeight: window.innerHeight,
            colors: ['#cc3333', '#81C784'],
            calc: (props, i) => ({
                ...props,
                x: (i + 1) * (window.innerWidth / 3) * Math.random(),
                y: window.innerHeight * Math.random()
            })
        }
        return (
            <>
                <Header problemList={problemList} loadProblem={this.loadProblem} gridValues={this.state.gridValues} problem={this.state.problem} resetGame={this.resetGame} />
                {this.state.loading ? (<ReactLoading type={"bars"} color={"#777"} height={"40vh"} width={"40vh"} />) : (
                    <div id="game-board" className="gameBoard" style={{ border: this.state.gameBoardBorderStyle }}>
                        <div className="row">
                            <Grid9x9 row_offset={0} col_offset={0}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 0, 0)}
                                fixedValue={this.extractArray(this.state.problem.content, 0, 0)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={0} col_offset={3}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 3, 0)}
                                fixedValue={this.extractArray(this.state.problem.content, 3, 0)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={0} col_offset={6}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 6, 0)}
                                fixedValue={this.extractArray(this.state.problem.content, 6, 0)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />
                        </div>
                        <div className="row">
                            <Grid9x9 row_offset={3} col_offset={0}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 0, 3)}
                                fixedValue={this.extractArray(this.state.problem.content, 0, 3)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={3} col_offset={3}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 3, 3)}
                                fixedValue={this.extractArray(this.state.problem.content, 3, 3)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={3} col_offset={6}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 6, 3)}
                                fixedValue={this.extractArray(this.state.problem.content, 6, 3)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />
                        </div>
                        <div className="row">
                            <Grid9x9 row_offset={6} col_offset={0}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 0, 6)}
                                fixedValue={this.extractArray(this.state.problem.content, 0, 6)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={6} col_offset={3}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 3, 6)}
                                fixedValue={this.extractArray(this.state.problem.content, 3, 6)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />

                            <Grid9x9 row_offset={6} col_offset={6}
                                handle_grid_1x1_click={this.handle_grid_1x1_click}
                                value={this.extractArray(this.state.gridValues, 6, 6)}
                                fixedValue={this.extractArray(this.state.problem.content, 6, 6)}
                                selectedGrid={this.state.selectedGrid}
                                conflicts={this.state.conflicts} />
                        </div>
                    </div>
                )}
                {this.state.completeFlag ? (<Fireworks {...fxProps} />) : null}
                {this.state.loading ? null : (<ScreenInputKeyBoard handleScreenKeyboardInput={this.handleScreenKeyboardInput} />)}
            </>
        );
    }
}

export default Sudoku;