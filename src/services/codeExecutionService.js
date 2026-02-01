// Code Execution Service using Piston API
// Free code execution API - no API key needed
// API Documentation: https://github.com/engineer-man/piston

import axios from 'axios';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// Language mappings for Piston API
const LANGUAGE_CONFIG = {
    python: {
        language: 'python',
        version: '3.10.0',
        aliases: ['py', 'python3']
    },
    javascript: {
        language: 'javascript',
        version: '18.15.0',
        aliases: ['js', 'node']
    },
    cpp: {
        language: 'cpp',
        version: '10.2.0',
        aliases: ['c++', 'g++']
    },
    java: {
        language: 'java',
        version: '15.0.2',
        aliases: []
    },
    c: {
        language: 'c',
        version: '10.2.0',
        aliases: ['gcc']
    }
};

class CodeExecutionService {
    constructor() {
        this.isExecuting = false;
    }

    /**
     * Execute code using Piston API
     * @param {string} code - The source code to execute
     * @param {string} language - The programming language (python, javascript, cpp, java, c)
     * @param {string} stdin - Optional standard input for the program
     * @returns {Promise<object>} - Execution result with output, error, and timing info
     */
    async executeCode(code, language = 'python', stdin = '') {
        if (!code || !code.trim()) {
            return {
                success: false,
                output: '',
                error: 'No code to execute. Please write some code first.',
                executionTime: 0,
                language: language
            };
        }

        const langConfig = LANGUAGE_CONFIG[language];
        if (!langConfig) {
            return {
                success: false,
                output: '',
                error: `Unsupported language: ${language}`,
                executionTime: 0,
                language: language
            };
        }

        this.isExecuting = true;
        const startTime = Date.now();

        try {
            const response = await axios.post(PISTON_API_URL, {
                language: langConfig.language,
                version: langConfig.version,
                files: [
                    {
                        name: this.getFileName(language),
                        content: code
                    }
                ],
                stdin: stdin,
                args: [],
                compile_timeout: 10000,
                run_timeout: 5000,
                compile_memory_limit: -1,
                run_memory_limit: -1
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });

            const executionTime = Date.now() - startTime;
            const result = response.data;

            // Check for compilation errors (for compiled languages)
            if (result.compile && result.compile.code !== 0) {
                return {
                    success: false,
                    output: '',
                    error: result.compile.stderr || result.compile.output || 'Compilation failed',
                    executionTime: executionTime,
                    language: language,
                    stage: 'compile'
                };
            }

            // Check for runtime errors
            if (result.run) {
                const hasError = result.run.code !== 0 || result.run.stderr;
                const output = result.run.stdout || result.run.output || '';
                const error = result.run.stderr || '';

                return {
                    success: !hasError || output.length > 0,
                    output: output,
                    error: error,
                    executionTime: executionTime,
                    language: language,
                    exitCode: result.run.code,
                    stage: 'run'
                };
            }

            return {
                success: false,
                output: '',
                error: 'Unknown execution error',
                executionTime: executionTime,
                language: language
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Handle network errors
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return {
                    success: false,
                    output: '',
                    error: 'Execution timed out. Your code may have an infinite loop or is taking too long.',
                    executionTime: executionTime,
                    language: language
                };
            }

            if (error.response) {
                // Server responded with an error
                return {
                    success: false,
                    output: '',
                    error: `Server error: ${error.response.status} - ${error.response.statusText}`,
                    executionTime: executionTime,
                    language: language
                };
            }

            if (error.request) {
                // Network error
                return {
                    success: false,
                    output: '',
                    error: 'Network error. Please check your internet connection and try again.',
                    executionTime: executionTime,
                    language: language
                };
            }

            return {
                success: false,
                output: '',
                error: `Execution error: ${error.message}`,
                executionTime: executionTime,
                language: language
            };

        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Get appropriate filename for the language
     */
    getFileName(language) {
        const fileNames = {
            python: 'main.py',
            javascript: 'main.js',
            cpp: 'main.cpp',
            java: 'Main.java',
            c: 'main.c'
        };
        return fileNames[language] || 'main.txt';
    }

    /**
     * Get list of supported languages
     */
    getSupportedLanguages() {
        return Object.keys(LANGUAGE_CONFIG);
    }

    /**
     * Check if a language is supported
     */
    isLanguageSupported(language) {
        return language in LANGUAGE_CONFIG;
    }
}

export const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;
