# Test Project for Multi-Root Workspace

This is a test project for a multi-root workspace.

## Steps to Test

1. Open `workspace.code-workspace` from the Extensions Dev Host.
1. All projects should be linted correctly.  
   `project-1-sub-1` and `project-1-sub-2` are also available within `project-1`,  
   and they are also added to the workspace directly.  
   This is used to test detection of the outermost workspace folder.
1. In `project-3`, the status bar should be yellow because there is no config file for AGLint.
